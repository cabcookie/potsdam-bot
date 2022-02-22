import { Stack, StackProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { githubRepo } from '../../config';
// import { LambdaCrawlerStack } from './lambda-crawler-stack';
// import { PBotCrawlerStage } from './pbot-crawler-stage';

export class PotsdamBotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'PBotPipeline', {
      pipelineName: 'PotsBot',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(githubRepo, 'main'),
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth',
        ],
      }),
    });

    // const anotherStack = new LambdaCrawlerStack(this, 'PBotCrawlerStack', {
    //   // stackName: 'potsdam-bot-crawler',
    //   // description: 'This creates a bot which crawls for available slots at the Potsdam Bürgerservice, books one according to the preference of the citizen and informs the person about the success.',
    //   env: {
    //     account: props?.env?.account,
    //     region: props?.env?.region,
    //   },
    // });

    // pipeline.addStage(new PBotCrawlerStage(this, 'PBotCrawlerStage', {
    //   stackName: 'PBotCrawlerStage',
    //   description: 'Creating the Lambda function which crawls the desired URL.',
    // }));
  }
}
