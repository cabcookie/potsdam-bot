#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { PotsdamBotStack } from '../lib/potsdam-bot-stack';
// import { LambdaCrawlerStack } from '../lib/lambda-crawler-stack';

const app = new App();

// new LambdaCrawlerStack(app, 'PBotCrawlerStack', {
new PotsdamBotStack(app, 'PotsdamBotContainerStack', {
  stackName: 'potsdam-bot',
  description: 'This creates a bot which crawls for available slots at the Potsdam Bürgerservice, books one according to the preference of the citizen and informs the person about the success.',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();
