import { Stack, StackProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { githubRepo } from '../../config';
import { PBotCrawlerStage } from './pbot-crawler-stage';

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

    // pipeline.addStage(new PBotCrawlerStage(this, 'PBotCrawlerStage', {
    //   stackName: 'PBotCrawlerStage',
    //   description: 'Creating the Lambda function which crawls the desired URL.',
    // }));
  }
}
