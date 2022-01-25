import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class LambdaCrawlerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // const lambda = new Function(this, 'LambdaTest', {
    //   code: Code.fromAsset('functions/crawl-page'),
    //   handler: 'index.handler',
    //   runtime: Runtime.NODEJS_14_X,
    // });

    const lambdaCrawler = new NodejsFunction(this, 'CrawlPotsdamPage', {
      functionName: 'crawlPotsdamPage',
      runtime: Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: './functions/crawl-page/index.ts',
      // timeout: Duration.minutes(5),
      // memorySize: 2048,
      // environment: { REGION: this.region },
    });

    const rule = new Rule(this, 'CronJobToRunCrawler', {
      schedule: Schedule.rate(Duration.seconds(30)),
    });

    rule.addTarget(new LambdaFunction(lambdaCrawler));
  }
}