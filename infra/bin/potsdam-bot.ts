#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
// import { PotsdamBotStack } from '../lib/potsdam-bot-stack';
import { LambdaCrawlerStack } from '../lib/lambda-crawler-stack';

const app = new App();

/**
 * TODO: Add a pipeline according to this article: https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html
 * include testing to deploy the app from a staging environment to a production environment
 * actually the pipeline should react to changes on the branch 'dev'
 * and push changes to the branch 'main' whenever everything is okay, and whenever it is not,
 * it should create an issue including the CloudWatch logs trail.
 * A push to 'main' should then trigger a deployment to the production system. 
 * 
 * Maybe this article is helpful as well: https://taimos.de/blog/deploying-your-cdk-app-to-different-stages-and-environments
 * or this one: https://sbstjn.com/blog/deploy-react-cra-with-cdk-codepipeline-and-codebuild/
 */

new LambdaCrawlerStack(app, 'PBotCrawlerStack', {
// new PotsdamBotStack(app, 'PotsdamBotContainerStack', {
  stackName: 'potsdam-bot',
  description: 'This creates a bot which crawls for available slots at the Potsdam Bürgerservice, books one according to the preference of the citizen and informs the person about the success.',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();
