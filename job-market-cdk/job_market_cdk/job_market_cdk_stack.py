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
            description="Tracks batch jobs' statuses from OpenAI API.",
            partition_key=dynamodb.Attribute(name="batch_id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="batch_id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
        )

        dedup_jobs_table = dynamodb.Table(
            self, "JobDedupe",
            description="Tracks jobs to avoid duplicates.",
            partition_key=dynamodb.Attribute(
                name="source",  # indeed, linkedin, etc
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="job_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        )           
        
        


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

        # Lambda for scraping jobs
        scrape_jobs_lambda = _lambda.Function(self, "JobTrendrBackend-ScrapeJobsFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="jobspy_scrapers.handler",
            function_name="JobTrendrBackend-ScrapeJobsFunction",
            description="Scrapes jobs and writes to S3.",
            code=_lambda.Code.from_asset("lambda"),
            layers=[jobspy_layer, boto3_layer],
            environment={
                "OPENAI_API_KEY": openai_api_key_secret
            },
            timeout=Duration.minutes(5),
            memory_size=512
        )

        # Batch processor Lambda
        batch_processor = _lambda.Function(self, "JobTrendrBackend-BatchProcessor",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="batch_processor.handler",
            function_name="JobTrendrBackend-BatchProcessor",
            description="Gets triggered by S3 writes (new jobs scraped), sends a batch job to OpenAI, and tracks the job in DynamoDB.",
            code=_lambda.Code.from_asset("lambda"),
            environment={
                "BATCH_BUCKET": batch_bucket.bucket_name,
                "BATCH_TABLE": batch_table.table_name,
                "OPENAI_API_KEY": openai_api_key_secret
            },
            timeout=Duration.minutes(15),
            memory_size=1024
        )

        # Grant permissions to the batch processor
        batch_bucket.grant_write(batch_processor)
        batch_table.grant_read_write_data(batch_processor)  
        openai_secret.grant_read(batch_processor)


        batch_poller = _lambda.Function(self, "JobTrendrBackend-BatchPoller",
            runtime=_lambda.Runtime.PYTHON_3_12,
            function_name="JobTrendrBackend-BatchPoller",
            description="Polls batch jobs from OpenAI API. Writes to Mongo when new jobs completed.",
            handler="batch_poller.handler",
            code=_lambda.Code.from_asset("lambda"),
            environment={
                "BATCH_TABLE": batch_table.table_name,
                "OPENAI_SECRET_ARN": openai_secret.secret_arn,
                "MONGODB_URI": mongodb_uri_secret,
                "MONGODB_DATABASE": mongodb_db,
                "MONGODB_COLLECTION": mongodb_collection
            },
            timeout=Duration.minutes(5)
        )



        # configs 


         # S3 event trigger for new scrapes
        batch_bucket.add_event_notification(
        _s3.EventType.OBJECT_CREATED,
        s3n.LambdaDestination(batch_processor),
        _s3.NotificationKeyFilter(prefix="raw_scrapes/")
)




        # #################### SCHEDULE ###############################

        # Scheduled rule for status checks
        batch_poller_schedule = events.Rule(
            self, 
            "BatchPollerSchedule",
            schedule=events.Schedule.cron(Duration.hours(6)),
            targets=[targets.LambdaFunction(batch_poller)]
        )


        # Scheduled rule for scraping
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
        batch_poller.add_to_role_policy(cloudwatch_policy)
        batch_processor.add_to_role_policy(cloudwatch_policy)


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
        for lambda_func in [scrape_jobs_lambda, batch_poller, batch_processor]:
            lambda_func.add_to_role_policy(metrics_policy)

        # Create CloudWatch Log group outputs for easy reference
        CfnOutput(self, "ScrapeJobsLogGroup", value=scrape_jobs_lambda.log_group.log_group_name)
        CfnOutput(self, "S3WriterLogGroup", value=s3_writer_lambda.log_group.log_group_name)
        CfnOutput(self, "MongoDBWriterLogGroup", value=mongodb_writer_lambda.log_group.log_group_name)



