import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdaCrawlerStack } from "./lambda-crawler-stack";

export class PBotCrawlerStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new LambdaCrawlerStack(this, 'PBotCrawlerStack', {
      stackName: 'PBotCrawlerStack',
      description: 'Creating the Lambda that crawls the desired URL.'
    });
  }
}