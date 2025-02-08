from aws_cdk import (
    # Duration,
    Stack,
    aws_s3 as _s3, 
    aws_lambda as _lambda,
    aws_events as events,
    aws_events_targets as targets, 
    aws_iam as iam,
    dynamodb,
    aws_secretsmanager as sm,
    Duration, 
    CfnOutput,
    aws_sqs as sqs,
    aws_lambda_event_sources as lambda_event_source,
)
from constructs import Construct
import boto3
import json
from utils.secrets import get_mongodb_uri, get_db_collection, get_openai_api_key
from botocore.exceptions import ClientError



class JobMarketCdkStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ************************************************************
        # *                                                          *
        # *                         Storage                          * 
        # *                                                          *
        # ************************************************************

        # From the previous stack architeture
        s3_bucket = _s3.Bucket(self, "JobPostingsRawData", 
            block_public_access=_s3.BlockPublicAccess.BLOCK_ALL
        )

        batch_bucket = _s3.Bucket(self, "JobPostsBatches", 
            block_public_access=_s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                _s3.LifecycleRule(
                    transitions=[
                        _s3.Transition(
                            storage_class=_s3.StorageClass.INTELLIGENT_TIERING,
                            transition_after=Duration.days(0)
                        ),

                    ],
                    enabled=True
                )
            ]
        )

        batch_jobs_table = dynamodb.Table(self, "BatchJobsTable",
            partition_key=dynamodb.Attribute(name="batch_id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="batch_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
        )
        
        

        batch_bucket.grant_write(sync_s3_mongo_lambda)

        # ************************************************************
        # *                                                          *
        # *                         Secrets                          * 
        # *                                                          *
        # ************************************************************

        mongodb_uri_secret = get_mongodb_uri()
        mongodb_db, mongodb_collection = get_db_collection()
        openai_api_key_secret = get_openai_api_key()

        # ************************************************************
        # *                                                          *
        # *                   Lambda Layers                          * 
        # *                                                          *
        # ************************************************************
        pymongo_layer = _lambda.LayerVersion(
            self,
            "PymongoLayer",
            code=_lambda.Code.from_asset("layer/pymongo_layer/pymongo_layer.zip"),
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_12],
            description="Layer containing pymongo library and dependencies"
        )

        boto3_layer = _lambda.LayerVersion(
            self,
            "boto3Layer",
            code=_lambda.Code.from_asset("layer/boto3_layer/boto3_layer.zip"),
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_12],
            description="Layer containing boto3 library and dependencies"
        )

        jobspy_layer = _lambda.LayerVersion(
            self,
            "JobspyLayer",
            code=_lambda.Code.from_asset("layer/jobspy_layer/jobspy_layer.zip"),
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_12],
            description="Layer containing jobspy library and dependencies"
        )

        # ************************************************************
        # *                                                          *
        # *                   Lambda Functions                       * 
        # *                                                          *
        # ************************************************************

        sync_s3_mongo_lambda = _lambda.Function(self, "SyncS3MongoFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="sync_s3_mongo.handler",
            code=_lambda.Code.from_asset("lambda"),
            layers=[boto3_layer, pymongo_layer],
            environment={
                "MONGODB_URI": mongodb_uri_secret,
                "MONGODB_DATABASE": mongodb_db,
                "MONGODB_COLLECTION": mongodb_collection, 
            },
            timeout=Duration.minutes(5),
            memory_size=512
        )


        s3_bucket.grant_read(sync_s3_mongo_lambda)

        # Lambda for scraping jobs
        scrape_jobs_lambda = _lambda.Function(self, "ScrapeJobsFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="jobspy_scrapers.handler",
            code=_lambda.Code.from_asset("lambda"),
            layers=[jobspy_layer, boto3_layer],
            environment={
                "OPENAI_API_KEY": openai_api_key_secret
            },
            timeout=Duration.minutes(5),
            memory_size=512
        )

       

  


        # Lambda to write data to S3
        s3_writer_lambda = _lambda.Function(self, "S3WriterFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="s3_writer.handler",
            code=_lambda.Code.from_asset("lambda"),
            environment={
                "BUCKET_NAME": s3_bucket.bucket_name,
            },
            timeout=Duration.minutes(5),
            memory_size=512
        )

        # Grant the Lambda function permissions to write to S3
        s3_bucket.grant_write(s3_writer_lambda)




        # Create MongoDB writer Lambda
        mongodb_writer_lambda = _lambda.Function(
            self,
            "MongoDBWriterFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="mongodb_writer.handler",
            code=_lambda.Code.from_asset("lambda"),
            layers=[pymongo_layer],
            environment={
                "MONGODB_URI": mongodb_uri_secret,
                "MONGODB_DATABASE": mongodb_db,
                "MONGODB_COLLECTION": mongodb_collection
            },
            timeout=Duration.minutes(5),
            memory_size=512
        )




        


        # Grant lambdas to put events on the event bus
        event_policy = iam.PolicyStatement(effect=iam.Effect.ALLOW, resources=['*'], actions=['events:PutEvents'])
        scrape_jobs_lambda.add_to_role_policy(event_policy)
        s3_writer_lambda.add_to_role_policy(event_policy)
        sync_s3_mongo_lambda.add_to_role_policy(event_policy)


        # #################### SCHEDULE ###############################
        scrape_schedule = events.Rule(
            self,
            "ScrapeScheduleRule",
            schedule=events.Schedule.rate(Duration.hours(12)),
            targets=[targets.LambdaFunction(scrape_jobs_lambda)]
        )

        # Add permission for EventBridge to invoke the Lambda
        scrape_jobs_lambda.add_permission(
            "ScheduledEventPermission",
            principal=iam.ServicePrincipal("events.amazonaws.com"),
            action="lambda:InvokeFunction",
            source_arn=scrape_schedule.rule_arn
        )

        
      

        # Add CloudWatch logging permissions for all Lambda functions
        cloudwatch_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            resources=["*"]  # You might want to restrict this to specific log groups
        )

        # Add logging configuration for each Lambda
        scrape_jobs_lambda.add_to_role_policy(cloudwatch_policy)
        s3_writer_lambda.add_to_role_policy(cloudwatch_policy)
        mongodb_writer_lambda.add_to_role_policy(cloudwatch_policy)

        # Add CloudWatch Metrics permissions
        metrics_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "cloudwatch:PutMetricData",
                "cloudwatch:GetMetricData",
                "cloudwatch:GetMetricStatistics"
            ],
            resources=["*"]
        )

        # Add metrics permissions to all Lambdas
        for lambda_func in [scrape_jobs_lambda, s3_writer_lambda, mongodb_writer_lambda]:
            lambda_func.add_to_role_policy(metrics_policy)

        # Create CloudWatch Log group outputs for easy reference
        CfnOutput(self, "ScrapeJobsLogGroup", value=scrape_jobs_lambda.log_group.log_group_name)
        CfnOutput(self, "S3WriterLogGroup", value=s3_writer_lambda.log_group.log_group_name)
        CfnOutput(self, "MongoDBWriterLogGroup", value=mongodb_writer_lambda.log_group.log_group_name)



