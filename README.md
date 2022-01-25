# `potsdam-bot`

This bot exist to organize a meeting in the Bürgerbüro. It is hard to get a slot, so this bot should register one automatically if one is available. It will inform you via SMS if a slot it booked.

## Architecture

With the AWS CDK this will create a pipeline, which fetches the latest code from the Github repository.
The Github repository is defined in the `./config.ts` file. See details on the settings in #configuration.

## Getting Started

To build your own bot, you will need an AWS account. Ensure you have access from your computer to the AWS Account.
You then fork the original repository on Github and clone it locally.
You [adjust the configuration as decribed here](#configuration).
Create a Github developer token and store it in AWS Secrets Manager in a secret with the name `github-token`.

You need to bootstrap the CDK:

```bash
export CDK_NEW_BOOTSTRAP=1 
npx cdk bootstrap aws://[ACCOUNT-ID]/[REGION] \
    --profile ADMIN-PROFILE \
    --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

**--cloudformation-execution-policies** specifies the ARN of a policy under which future CDK Pipelines deployments will execute. The default `AdministratorAccess` policy ensures that your pipeline can deploy every type of AWS resource. If you use this policy, make sure you trust all the code and dependencies that make up your AWS CDK app.

Subscribe your phone number to the SMS sandbox (i.e., check the *[Account Information](https://console.aws.amazon.com/sns/v3/home?%2Fmobile%2Ftext-messaging=&#/mobile/text-messaging)*) in order to receive SMS confirmations.

If all the above mentioned steps are completed, commit your changes and push them to your repository then run:

```bash
cdk deploy
```

You only need to issue this command once, as this creates the pipeline. Whenever you push a new version of the code to the GitHub repo, the pipeline will be triggered, mutate itself if the pipeline has been changed and will then deploy the new application version as per the pipeline definition.

## Configuration

Adjust your `config.ts` to reflect your configuration:

```typescript
export const githubRepo = 'cabcookie/potsdam-bot';
```
