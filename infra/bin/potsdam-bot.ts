#!/usr/bin/env node
import 'source-map-support/register';
import { App, Tags } from 'aws-cdk-lib';
import { PotsdamBotStack } from '../lib/potsdam-bot-stack';
import { config } from "../../config";

const app = new App();

const stack = new PotsdamBotStack(app, 'PotsdamBotStack', {
  stackName: 'potsdam-bot',
  description: 'This creates a bot which crawls for available slots at the Potsdam Bürgerservice, books one according to the preference of the citizen and informs the person about the success.',
  github: {
    ...config.github
  },
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

Tags.of(stack).add("Project", "CDK Pipeline Starter Kit");

app.synth();
