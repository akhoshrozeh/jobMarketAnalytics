# JobTrendr

## What is it?
JobTrendr is a data analytics platform that provides real-time insights into the tech job market. By analyzing thousands of job postings daily, it helps users understand current and emerging trends in technical skills and job requirements.

## Who is it for?
- Job seekers looking to stay competitive in the tech industry
- Professionals planning their skill development
- Anyone interested in understanding which technical skills are:
  - Rising in demand
  - Maintaining steady popularity
  - Declining in relevance

## Features
- Real-time job market analysis
- Skill trend visualization
- Historical trend data
- Focus on technology sector jobs
- Daily updates from major job boards

## Tech Stack
### Web Application
- Next.js 15.1 with TypeScript
- D3.js and Observable Plot for data visualization
- TailwindCSS for styling

### Backend Infrastructure
- AWS CDK for Infrastructure as Code
- Amazon EventBridge for event-driven architecture
- AWS Lambda for serverless computing
- Amazon S3 for raw data storage
- Amazon SQS for job processing queue
- Amazon Bedrock for LLM processing
- MongoDB Atlas for processed data storage and querying

### Data Pipeline
- Automated job scraping (JobSpy) every 12 hours
- Event-driven processing flow:
  1. Job scraping Lambda
  2. S3 data storage
  3. Bedrock AI processing
  4. MongoDB data persistence
- CloudWatch for logging and metrics

### Security
- AWS Secrets Manager for credential management
- IAM roles and policies for secure service access
- S3 bucket with public access blocked

