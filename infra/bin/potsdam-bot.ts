#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from "aws-cdk-lib";
import { PotsdamBotStack } from '../lib/potsdam-bot-stack';

import { config } from "../../config";

const app = new cdk.App();
const stack = new PotsdamBotStack(app, 'PotsdamBotStack', {
  // stackName: 'potsdam-bot',
  // description: 'This creates a bot which crawls for available slots at the Potsdam Bürgerservice, books one according to the preference of the citizen and informs the person about the success.',
  githubRepositoryOwner: config.github.owner,
  githubRepositoryName: config.github.repository,

  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

cdk.Tags.of(stack).add("Project", "Potsdam Bot");

app.synth();
