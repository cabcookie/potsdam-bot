import { StackProps, Stage } from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdaCrawlerStack } from "./lambda-crawler-stack";

export class StageLambdaCrawler extends Stage {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaCrawlerStack = new LambdaCrawlerStack(this, 'LambdaCrawlerStack');
  }
}