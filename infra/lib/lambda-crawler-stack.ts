import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { DockerImageCode, DockerImageFunction } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

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
      logRetention: RetentionDays.FIVE_DAYS,
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

    // const lambdaCrawler = new NodejsFunction(this, 'CrawlPotsdamPage', {
    //   functionName: 'crawlPotsdamPage',
    //   runtime: Runtime.NODEJS_14_X,
    //   handler: 'handler',
    //   timeout: Duration.minutes(5),
    //   memorySize: 4096,
    //   entry: './functions/crawl-page/index.ts',
    //   bundling: {
    //     externalModules: [
    //       'aws-sdk',
    //       'puppeteer',
    //     ],
    //   },
    //   environment: {
    //     REGION: this.region,
    //     EMAIL: email.secretValueFromJson('email').toString(),
    //     BUCKETNAME: screenshotsBucket.bucketName,
    //   }
    // });

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
      schedule: Schedule.rate(Duration.minutes(60)),
    });

    cronJob.addTarget(new LambdaFunction(lambdaCrawler));

    new CfnOutput(this, 'BucketName', { value: screenshotsBucket.bucketName });
    new CfnOutput(this, 'LambdaArn', { value: lambdaCrawler.functionArn });
    new CfnOutput(this, 'LambdaVersion', { value: lambdaCrawler.latestVersion.version });
  }
}