#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { PotsdamBotStack } from '../lib/potsdam-bot-stack';

const app = new App();
new PotsdamBotStack(app, 'PotsdamBotStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});