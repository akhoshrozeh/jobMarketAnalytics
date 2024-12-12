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
    CfnOutput
    # aws_sqs as sqs,
)
from constructs import Construct

class JobMarketCdkStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 for raw storage
        s3_bucket = _s3.Bucket(self, "JobPostingsRawData", 
            block_public_access=_s3.BlockPublicAccess.BLOCK_ALL
        )

        boto3_layer = _lambda.LayerVersion(
            self,
            "boto3Layer",
            code=_lambda.Code.from_asset("layer/boto3_layer/boto3_layer.zip"),
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_12],
            description="Layer containing boto3 library and dependencies"
        )

        # Create jobspy layer
        jobspy_layer = _lambda.LayerVersion(
            self,
            "JobspyLayer",
            code=_lambda.Code.from_asset("layer/jobspy_layer/jobspy_layer.zip"),
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_12],
            description="Layer containing jobspy library and dependencies"
        )

        # Lambda for scraping jobs
        scrape_jobs_lambda = _lambda.Function(self, "ScrapeJobsFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="jobspy_scrapers.handler",
            code=_lambda.Code.from_asset("lambda"),
            layers=[jobspy_layer, boto3_layer],
              environment={
                "EVENT_BUS_NAME": "JobScrapeEventBus"
            },
            timeout=Duration.minutes(5),
            memory_size=512
        )

       

        # Create EventBridge event bus
        event_bus = events.EventBus(self, "JobScrapeEventBus", event_bus_name="JobScrapeEventBus")



        # Lambda to write data to S3
        # TODO: rewrite this lambda for data formatting
        s3_writer_lambda = _lambda.Function(self, "S3WriterFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="s3_writer.handler",
            code=_lambda.Code.from_asset("lambda"),
            environment={
                "BUCKET_NAME": s3_bucket.bucket_name
            },
            timeout=Duration.minutes(5),
            memory_size=512
        )

        # Grant the Lambda function permissions to write to S3
        s3_bucket.grant_write(s3_writer_lambda)

        # Create Bedrock processing Lambda
        # TODO: rewrite this lambda: prompts, model, data extraction
        bedrock_processor_lambda = _lambda.Function(
            self,
            "BedrockProcessorFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="bedrock_processor.handler",
            code=_lambda.Code.from_asset("lambda"),
            environment={
                "EVENT_BUS_NAME": event_bus.event_bus_name
            },
            timeout=Duration.minutes(5),
            memory_size=512
        )

        # Add Bedrock permissions
        bedrock_policy = iam.PolicyStatement(
            actions=[
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            resources=["*"]  # You might want to restrict this to specific model ARNs
        )
        bedrock_processor_lambda.add_to_role_policy(bedrock_policy)


        # Get the secret
        mongo_secret = sm.Secret.from_secret_attributes(self, "ImportedSecret", secret_complete_arn="arn:aws:secretsmanager:us-east-1:120590743722:secret:mongodb/jobMarketWriter-TFxVwv").to_string()
        
        # Create MongoDB writer Lambda
        # TODO: rewrite lambda for correct mongo db and permissions
        mongodb_writer_lambda = _lambda.Function(
            self,
            "MongoDBWriterFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="mongodb_writer.handler",
            code=_lambda.Code.from_asset("lambda"),
            environment={
                "MONGODB_URI": mongo_secret
            },
            timeout=Duration.minutes(5),
            memory_size=512
        )

        # Create EventBridge rule to trigger S3 writer Lambda
        s3_writer_rule = events.Rule(self, "S3WriterRule",
            event_bus=event_bus,
            event_pattern=events.EventPattern(
                source=["job.scraper"],
                detail_type=["JobScrapeEvent"]
            ))

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
            event_pattern={
                "source": ["job.scraper"]
            }
        )
        bedrock_processor_rule.add_target(targets.LambdaFunction(bedrock_processor_lambda))


        event_policy = iam.PolicyStatement(effect=iam.Effect.ALLOW, resources=['*'], actions=['events:PutEvents'])
        scrape_jobs_lambda.add_to_role_policy(event_policy)


        # You can keep the existing grant_put_events_to line as well
        # event_bus.grant_put_events_to(scrape_jobs_lambda)

        # Grant permissions to put events on the event bus
        event_bus.grant_put_events_to(scrape_jobs_lambda)

        # Grant permissions to the Bedrock processor Lambda to put events
        event_bus.grant_put_events_to(bedrock_processor_lambda)

        # Grant permissions to the MongoDB writer Lambda to put events (if needed)
        event_bus.grant_put_events_to(mongodb_writer_lambda)



        # # Create EventBridge rule to trigger MongoDB writer Lambda
        # mongodb_writer_rule = events.Rule(self, "MongoDBWriterRule",
        #     event_bus=event_bus,
        #     event_pattern={
        #         "source": ["bedrock.processor"]
        #     }
        # )
        # mongodb_writer_rule.add_target(targets.LambdaFunction(mongodb_writer_lambda))

      

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



