import aws_cdk as core
import aws_cdk.assertions as assertions

from job_market_cdk.job_market_cdk_stack import JobMarketCdkStack

# example tests. To run these tests, uncomment this file along with the example
# resource in job_market_cdk/job_market_cdk_stack.py
def test_sqs_queue_created():
    app = core.App()
    stack = JobMarketCdkStack(app, "job-market-cdk")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
