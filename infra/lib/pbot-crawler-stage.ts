import { StackProps, Stage } from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdaCrawlerStack } from "./lambda-crawler-stack";

export class PBotCrawlerStage extends Stage {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaCrawlerStack = new LambdaCrawlerStack(this, 'PBotCrawlerStack', {
      stackName: 'PBotCrawlerStack',
      description: 'Creating the Lambda that crawls the desired URL.'
    });
  }
}