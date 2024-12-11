from aws_cdk import (
    # Duration,
    Stack,
    aws_s3 as _s3, 
    aws_lambda as _lambda,
    Duration
    # aws_sqs as sqs,
)
from constructs import Construct

class JobMarketCdkStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # SERVICES
        # BACKEND
        # eventbridge for scheduling scrapers
        # lambda layer: scraper py library, mongo driver
        # scraper lambdas

        # bedrock for parsing LLMs
            # triggered on s3 updates
        # lambda: writing bedrock data + original data to mongo as a collection


        # S3 for raw storage
        s3_bucket = _s3.Bucket(self, "JobPostingsRawData", 
            block_public_access=_s3.BlockPublicAccess.BLOCK_ALL
        )


        # Create jobspy layer
        jobspy_layer = _lambda.LayerVersion(
            self,
            "JobspyLayer",
            code=_lambda.Code.from_asset("layer/python/layer.zip"),
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_12],
            description="Layer containing jobspy library and dependencies"
        )

        # Lambda for scraping jobs
        scrape_jobs_lambda = _lambda.Function(self, "ScrapeJobsFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="jobspy_scrapers.handler",
            code=_lambda.Code.from_asset("lambda"),
            layers=[jobspy_layer],
            environment={
                "BUCKET_NAME": s3_bucket.bucket_name
            },
            timeout=Duration.minutes(5)
        )
        
        # Grant the Lambda function permissions to write to S3
        s3_bucket.grant_write(scrape_jobs_lambda)









# FRONT END: diff stack
# api gateway + lambda: for querying mongodb



