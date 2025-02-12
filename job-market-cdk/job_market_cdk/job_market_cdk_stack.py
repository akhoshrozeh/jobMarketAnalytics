from aws_cdk import (
    # Duration,
    Stack,
    aws_s3 as _s3, 
    aws_lambda as _lambda,
    aws_events as events,
    aws_events_targets as targets, 
    aws_iam as iam,
    aws_dynamodb as dynamodb,
    aws_secretsmanager as sm,
    aws_s3_notifications as aws_s3_notifications,
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

         # Contains all jobs and which batch they're in
        jobs_table = dynamodb.Table(
            self, "JobsTable",
            partition_key=dynamodb.Attribute(
                name="site",  # indeed, linkedin, etc
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        )           

        jobs_table.add_global_secondary_index(
            index_name="InternalGroupBatchIndex",
            partition_key=dynamodb.Attribute(
                name="internal_group_batch_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )

        # Used to track batch jobs' statuses from OpenAI API.
        batches_table = dynamodb.Table(self, "BatchesTable",
            partition_key=dynamodb.Attribute(
                name="internal_group_batch_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        )

        # Add a Global Secondary Index for querying by 'status'
        batches_table.add_global_secondary_index(
            index_name="StatusIndex",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
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

        openai_layer = _lambda.LayerVersion(
            self,
            "OpenAILayer",
            code=_lambda.Code.from_asset("layer/openai_layer/openai_layer.zip"),
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_12],
            description="Layer containing openai library and dependencies"
        )

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

       

        # Batch processor Lambda
        batch_dispatcher = _lambda.Function(self, "JobTrendrBackend-BatchDispatcher",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="batch_dispatcher.handler",
            description="Gets by job scraper lambda, sends a batch job to OpenAI, and tracks the batch in DynamoDB.",
            code=_lambda.Code.from_asset("lambda"),
            environment={
                "BATCHES_TABLE": batches_table.table_name,
                "JOBS_TABLE": jobs_table.table_name,
                "OPENAI_API_KEY": openai_api_key_secret
            },
            layers=[openai_layer],
            timeout=Duration.minutes(15),
            memory_size=1024
        )

         # Lambda for scraping jobs
        scrape_jobs_lambda = _lambda.Function(self, "JobTrendrBackend-ScrapeJobsFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="jobspy_scrapers.handler",
            description="Scrapes jobs, creates an internal batch id, writes to DDB, then triggers the batch dispatcher.",
            code=_lambda.Code.from_asset("lambda"),
            layers=[jobspy_layer, boto3_layer],
            environment={
                "OPENAI_API_KEY": openai_api_key_secret,
                "JOBS_TABLE": jobs_table.table_name,
                "BATCH_DISPATCHER_LAMBDA": batch_dispatcher.function_name
            },
            timeout=Duration.minutes(15),
            memory_size=1024
        )

        # Polls batch jobs from OpenAI API. Writes to Mongo when new jobs completed.
        batch_poller = _lambda.Function(self, "JobTrendrBackend-BatchPoller",
            runtime=_lambda.Runtime.PYTHON_3_12,
            description="Polls batch jobs from OpenAI API. Writes to Mongo when new jobs completed.",
            handler="batch_poller.handler",
            code=_lambda.Code.from_asset("lambda"),
            layers=[pymongo_layer, boto3_layer, openai_layer],
            environment={
                "BATCHES_TABLE": batches_table.table_name,
                "OPENAI_API_KEY": openai_api_key_secret,
                "MONGODB_URI": mongodb_uri_secret,
                "MONGODB_DATABASE": mongodb_db,
                "MONGODB_COLLECTION": mongodb_collection
            },
            timeout=Duration.minutes(5)
        )



        # ************************************************************
        # *                                                          *
        # *                 Configs and Permissions                  * 
        # *                                                          *
        # ************************************************************


        # scraper can read/write to dedup table
        scrape_jobs_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:BatchWriteItem"],
            resources=[jobs_table.table_arn, batches_table.table_arn]
        ))

        # allow scraper to invoke batch dispatcher
        scrape_jobs_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=["lambda:invokeFunction"],
            resources=[batch_dispatcher.function_arn]
        ))

        # batch processor can read/write to batch jobs table for tracking
        batch_dispatcher.add_to_role_policy(iam.PolicyStatement(
            actions=["dynamodb:Query", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem"],
            resources=[
                jobs_table.table_arn,
                batches_table.table_arn,
                f"{jobs_table.table_arn}/index/InternalGroupBatchIndex"
                ]
        ))

        batch_poller.add_to_role_policy(iam.PolicyStatement(
            actions=["dynamodb:Query", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem"],
            resources=[
                jobs_table.table_arn, 
                batches_table.table_arn,
                f"{batches_table.table_arn}/index/StatusIndex"
                ]
        ))





        # Add permission for EventBridge to invoke the Lambda
        # scrape_jobs_lambda.add_permission(
        #     "ScheduledEventPermission",
        #     principal=iam.ServicePrincipal("events.amazonaws.com"),
        #     action="lambda:InvokeFunction",
        #     source_arn=scrape_schedule.rule_arn
        # )




        # #################### SCHEDULE ###############################

        # Scheduled rule for status checks
        # batch_poller_schedule = events.Rule(
        #     self, 
        #     "BatchPollerSchedule",
        #     schedule=events.Schedule.cron(Duration.hours(6)),
        #     targets=[targets.LambdaFunction(batch_poller)]
        # )


        # # Scheduled rule for scraping
        # scrape_schedule = events.Rule(
        #     self,
        #     "ScrapeScheduleRule",
        #     schedule=events.Schedule.rate(Duration.hours(12)),
        #     targets=[targets.LambdaFunction(scrape_jobs_lambda)]
        # )

        


        
      

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
        batch_dispatcher.add_to_role_policy(cloudwatch_policy)
        batch_poller.add_to_role_policy(cloudwatch_policy)


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
        for lambda_func in [scrape_jobs_lambda, batch_poller, batch_dispatcher]:
            lambda_func.add_to_role_policy(metrics_policy)

        # Create CloudWatch Log group outputs for easy reference
        CfnOutput(self, "ScrapeJobsLogGroup", value=scrape_jobs_lambda.log_group.log_group_name)
        CfnOutput(self, "BatchPollerLogGroup", value=batch_poller.log_group.log_group_name)
        CfnOutput(self, "BatchDispatcherLogGroup", value=batch_dispatcher.log_group.log_group_name)




