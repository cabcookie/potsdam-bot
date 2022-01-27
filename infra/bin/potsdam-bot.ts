#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { PotsdamBotStack } from '../lib/potsdam-bot-stack';

const app = new App();
new PotsdamBotStack(app, 'PotsdamBotStack', {
  description: 'This creates a bot which crawls for available slots at the Potsdam Bürgerservice, books one according to the preference of the citizen and informs the person about the success.',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});