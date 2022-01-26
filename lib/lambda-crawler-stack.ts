import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export class LambdaCrawlerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const email = Secret.fromSecretNameV2(this, 'Email', 'myPersonalIdentifiableInformation');

    const lambdaCrawler = new NodejsFunction(this, 'CrawlPotsdamPage', {
      functionName: 'crawlPotsdamPage',
      runtime: Runtime.NODEJS_14_X,
      handler: 'handler',
      timeout: Duration.minutes(1),
      // memorySize: 2048,
      entry: './functions/crawl-page/index.ts',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        REGION: this.region,
        EMAIL: email.secretValueFromJson('email').toString(),
      }
    });

    const rule = new Rule(this, 'CronJobToRunCrawler', {
      schedule: Schedule.rate(Duration.minutes(60)),
    });

    rule.addTarget(new LambdaFunction(lambdaCrawler));
  }
}