import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class LambdaCrawlerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaCrawler = new NodejsFunction(this, 'CrawlPotsdamPage', {
      functionName: 'crawlPotsdamPage',
      runtime: Runtime.NODEJS_14_X,
      handler: 'handler',
      // timeout: Duration.minutes(5),
      // memorySize: 2048,
      entry: './functions/crawl-page/index.ts',
      // bundling: {
      //   externalModules: ['aws-sdk'],
      // },
      // environment: { REGION: this.region },
    });

    const rule = new Rule(this, 'CronJobToRunCrawler', {
      schedule: Schedule.rate(Duration.minutes(1)),
    });

    rule.addTarget(new LambdaFunction(lambdaCrawler));
  }
}