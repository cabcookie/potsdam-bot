import { Construct } from "constructs";
import { Stage, StageProps } from "aws-cdk-lib";
import { LambdaCrawlerStack } from "./lambda-crawler-stack";

export class PBotCrawlerStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new LambdaCrawlerStack(this, 'PBotCrawlerStack');
  }
}