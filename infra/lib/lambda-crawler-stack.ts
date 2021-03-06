import { Construct } from "constructs";
import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { DockerImageCode, DockerImageFunction } from "aws-cdk-lib/aws-lambda";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";

export class LambdaCrawlerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const screenshotsBucket = new Bucket(this, 'ScreenshotBucket', {
      bucketName: 'potdam-bot-screenshots',
      encryption: BucketEncryption.S3_MANAGED,
    });

    const pii = Secret.fromSecretNameV2(this, 'PersonalIdenfiableInformation', 'myPersonalIdentifiableInformation');

    const lambdaCrawler = new DockerImageFunction(this, 'CrawlPotsdamPage', {
      functionName: 'crawlPotsdamPage',
      description: 'Lambda crawling the web page of the Potsdam Bürgerservice',
      memorySize: 1536,
      timeout: Duration.minutes(1),
      environment: {
        REGION: this.region,
        BUCKET: screenshotsBucket.bucketName,
        EMAIL: pii.secretValueFromJson('email').toString(),
        PHONE: pii.secretValueFromJson('phoneNumber').toString(),
      },
      code: DockerImageCode.fromImageAsset('./', {
        exclude: [
          'node_modules',
          'infra',
          'cdk.out',
        ],
      }),
    });

    lambdaCrawler.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'lambda:InvokeFunction',
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    }));

    lambdaCrawler.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'ses:SendEmail',
        'ses:SendRawEmail',
        'ses:SendTemplatedEmail',
      ],
      resources: [
        `arn:aws:ses:${this.region}:${Stack.of(this).account}:identity/${pii.secretValueFromJson('email').toString()}`,
      ],
    }));

    screenshotsBucket.grantWrite(lambdaCrawler);

    const cronJob = new Rule(this, 'CronJobToRunCrawler', {
      ruleName: 'PotsdamBotCronJob',
      description: 'This will start the Lambda crawler per defined scheduling',
      schedule: Schedule.cron({
        minute: '*/5',
        hour: '7-16',
        weekDay: 'MON-SAT',
        month: '*',
        year: '*',
      }),
    });

    cronJob.addTarget(new LambdaFunction(lambdaCrawler));

    new CfnOutput(this, 'BucketName', { value: screenshotsBucket.bucketName });
    new CfnOutput(this, 'LambdaArn', { value: lambdaCrawler.functionArn });
    new CfnOutput(this, 'LambdaVersion', { value: lambdaCrawler.latestVersion.version });
  }
}