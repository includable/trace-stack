# TraceStack

**Self-hosted serverless tracing.**

Deploy a CloudFormation stack to your own AWS account for instant Lambda tracing. 
Complete with a self-hosted UI, so you stay in full control of your data, and you 
only pay for AWS usage related to tracing and storage.

[ IMAGE ]

## Batteries included

- **Auto-tracing**: deploy the stack, and a Lambda Layer for tracing will 
  automatically be added to all your Node.js Lambda functions.
- **Self-managed trace DB**: traces are saved in a DynamoDB table within your
  AWS account, so they never leave your organization.
- **Private dashboard**: your self-hosted dashboard makes it easy to browse
  through invocations, filter for errors, and drill down into logs, AWS 
  service operations and API calls your Lambda function executes.

## Getting started

Simply run the command below to deploy the stack:

```bash
aws cloudformation create-stack \
  --stack-name trace-stack \
  --capabilities CAPABILITY_NAMED_IAM \
  --template-url https://trace-stack-templates.s3.amazonaws.com/latest.yml \
  --parameters Region=eu-west-1
```


// TODO: use describe-stacks to get back the UI URL (https://stackoverflow.com/questions/41628487/getting-outputs-from-aws-cloudformation-describe-stacks - `--query 'Stacks[0].Outputs[?OutputKey==`DbUrl`].OutputValue' --output text`)

// https://github.com/lumigo-io/lumigo-node/blob/master/scripts/prepare_layer_files.sh