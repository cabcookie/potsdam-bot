import { Stack, StackProps, Stage } from "aws-cdk-lib";
import { Function, InlineCode, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
// import { LambdaCrawlerStack } from "./lambda-crawler-stack";

class TempLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new Function(this, 'TempLambda', {
      functionName: 'tempLambda',
      code: new InlineCode('exports.handler = _ => "Hello CDK";'),
      runtime: Runtime.NODEJS_14_X,
      handler: 'index.handler',
    });
  }
}

export class PBotCrawlerStage extends Stage {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new TempLambdaStack(this, 'TempLambdaStack', {
      stackName: 'TempLambdaStack',
    });

    // new LambdaCrawlerStack(this, 'PBotCrawlerStack', {
    //   stackName: 'PBotCrawlerStack',
    //   description: 'Creating the Lambda that crawls the desired URL.'
    // });
  }
}