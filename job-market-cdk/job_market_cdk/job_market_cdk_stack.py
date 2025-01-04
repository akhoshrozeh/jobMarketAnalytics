from aws_cdk import (
    # Duration,
    Stack,
    aws_s3 as _s3, 
    aws_lambda as _lambda,
    aws_events as events,
    aws_events_targets as targets, 
    aws_iam as iam,
    aws_secretsmanager as sm,
    Duration, 
    CfnOutput,
    aws_sqs as sqs,
    aws_lambda_event_sources as lambda_event_source,
)
from constructs import Construct
import boto3
import json
from utils.secrets import get_mongodb_uri, get_db_collection
from botocore.exceptions import ClientError



class JobMarketCdkStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ********
        s3_bucket = _s3.Bucket(self, "JobPostingsRawData", 
            block_public_access=_s3.BlockPublicAccess.BLOCK_ALL
        )

        mongodb_uri_secret = get_mongodb_uri()
        mongodb_db, mongodb_collection = get_db_collection()

     # Create EventBridge event bus
        event_bus = events.EventBus(self, "JobScrapeEventBus", event_bus_name="JobScrapeEventBus")

        bedrock_queue = sqs.Queue(self, "BedrockProcessorQueue", queue_name="BedrockProcessorQueue", visibility_timeout=Duration.minutes(5))
        # bedrock_dlq = sqs.DeadLetterQueue(self, "BedrockProcessorDLQ", queue=bedrock_queue)
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
                "EVENT_BUS_NAME": event_bus.event_bus_name,
                "QUEUE_URL": bedrock_queue.queue_url,   
            },
            timeout=Duration.minutes(5),
            memory_size=512
        )

        bedrock_queue.grant_send_messages(sync_s3_mongo_lambda) 

        s3_bucket.grant_read(sync_s3_mongo_lambda)

        # Lambda for scraping jobs
        scrape_jobs_lambda = _lambda.Function(self, "ScrapeJobsFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="jobspy_scrapers.handler",
            code=_lambda.Code.from_asset("lambda"),
            layers=[jobspy_layer, boto3_layer],
              environment={
                "EVENT_BUS_NAME": event_bus.event_bus_name
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
                "QUEUE_URL": bedrock_queue.queue_url,   
            },
            timeout=Duration.minutes(5),
            memory_size=512
        )

        # Grant the Lambda function permissions to write to S3
        s3_bucket.grant_write(s3_writer_lambda)


        bedrock_queue.grant_send_messages(s3_writer_lambda)



          # Add Bedrock permissions
        bedrock_access_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream",
                "bedrock:ListFoundationModels"
            ],
            resources=["*"]  # You might want to restrict this to specific model ARNs
        )
         # Create the IAM role for Lambda
        bedrock_access_role = iam.Role(
            self, 
            "BedrockAccessRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com")
        )
        
        # Add the policy to the role
        bedrock_access_role.add_to_policy(bedrock_access_policy)

        # Create Bedrock processing Lambda
        bedrock_processor_lambda = _lambda.Function(
            self,
            "BedrockProcessorFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="bedrock_processor.handler",
            code=_lambda.Code.from_asset("lambda"),
            role=bedrock_access_role,
            environment={
                "QUEUE_URL": bedrock_queue.queue_url,
                "EVENT_BUS_NAME": event_bus.event_bus_name
            },
            timeout=Duration.minutes(5),
            memory_size=512
        )

        bedrock_queue.grant_consume_messages(bedrock_processor_lambda)
        bedrock_processor_lambda.add_event_source(lambda_event_source.SqsEventSource(bedrock_queue, batch_size=1))
       

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




        

         # Create EventBridge rule to trigger S3 writer Lambda
        sync_s3_mongo_rule = events.Rule(self, "SyncS3MongoRule",
            event_bus=event_bus,
            event_pattern=events.EventPattern(
                source=["sync_s3_mongo"],
                detail_type=["SyncS3MongoEvent"]
            )
        )
        sync_s3_mongo_rule.add_target(targets.LambdaFunction(bedrock_processor_lambda))
       
        
        





        # Create EventBridge rule to trigger S3 writer Lambda
        s3_writer_rule = events.Rule(self, "S3WriterRule",
            event_bus=event_bus,
            event_pattern=events.EventPattern(
                source=["job.scraper"],
                detail_type=["JobScrapeEvent"]
            )
        )
        s3_writer_rule.add_target(targets.LambdaFunction(s3_writer_lambda))
        # Add Lambda invoke permissions for EventBridge
        s3_writer_lambda.add_permission(
            "EventBridgeInvoke",
            principal=iam.ServicePrincipal("events.amazonaws.com"),
            action="lambda:InvokeFunction",
            source_arn=s3_writer_rule.rule_arn
        )


        
        # Create EventBridge rule to trigger Bedrock processor Lambda
        bedrock_processor_rule = events.Rule(self, "BedrockProcessorRule",
            event_bus=event_bus,
            event_pattern=events.EventPattern(
                source=["s3.writer"],
                detail_type=["S3WriteCompleteEvent"]
            )
        )

        bedrock_processor_rule.add_target(targets.LambdaFunction(bedrock_processor_lambda))
        bedrock_processor_lambda.add_permission(
            "EventBridgeInvoke",
            principal=iam.ServicePrincipal("events.amazonaws.com"),
            action="lambda:InvokeFunction",
            source_arn=bedrock_processor_rule.rule_arn
        )




        # Trigger mongodb writer lambda
        mongodb_writer_rule = events.Rule(self, "MongoDBWriterRule",
            event_bus=event_bus,
            event_pattern=events.EventPattern(
                source=["bedrock.processor"],
                detail_type=["BedrockProcessedEvent"]
            )
        )
        mongodb_writer_rule.add_target(targets.LambdaFunction(mongodb_writer_lambda))
        mongodb_writer_lambda.add_permission(
            "EventBridgeInvoke",
            principal=iam.ServicePrincipal("events.amazonaws.com"),
            action="lambda:InvokeFunction",
            source_arn=mongodb_writer_rule.rule_arn
        )

        # Grant lambdas to put events on the event bus
        event_policy = iam.PolicyStatement(effect=iam.Effect.ALLOW, resources=['*'], actions=['events:PutEvents'])
        scrape_jobs_lambda.add_to_role_policy(event_policy)
        bedrock_processor_lambda.add_to_role_policy(event_policy)
        s3_writer_lambda.add_to_role_policy(event_policy)
        sync_s3_mongo_lambda.add_to_role_policy(event_policy)

        # You can keep the existing grant_put_events_to line as well
        event_bus.grant_put_events_to(s3_writer_lambda)

        # Grant permissions to put events on the    t bus
        event_bus.grant_put_events_to(scrape_jobs_lambda)

        # Grant permissions to the Bedrock processor Lambda to put events
        event_bus.grant_put_events_to(bedrock_processor_lambda)

        # Grant permissions to the MongoDB writer Lambda to put events (if needed)
        event_bus.grant_put_events_to(mongodb_writer_lambda)

        event_bus.grant_put_events_to(sync_s3_mongo_lambda)
      

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
        bedrock_processor_lambda.add_to_role_policy(cloudwatch_policy)
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
        for lambda_func in [scrape_jobs_lambda, s3_writer_lambda, bedrock_processor_lambda, mongodb_writer_lambda]:
            lambda_func.add_to_role_policy(metrics_policy)

        # Create CloudWatch Log group outputs for easy reference
        CfnOutput(self, "ScrapeJobsLogGroup", value=scrape_jobs_lambda.log_group.log_group_name)
        CfnOutput(self, "S3WriterLogGroup", value=s3_writer_lambda.log_group.log_group_name)
        CfnOutput(self, "BedrockProcessorLogGroup", value=bedrock_processor_lambda.log_group.log_group_name)
        CfnOutput(self, "MongoDBWriterLogGroup", value=mongodb_writer_lambda.log_group.log_group_name)
        CfnOutput(self, "EventBusName", value=event_bus.event_bus_name)




# FRONT END: diff stack
# api gateway + lambda: for querying mongodb



