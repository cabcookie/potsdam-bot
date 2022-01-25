import { Stack, StackProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { githubRepo } from '../config';
import { StageLambdaCrawler } from './stage-lambda-crawler';

export class PotsdamBotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'PotsdamBotPipeline', {
      pipelineName: 'PotsdamBot',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(githubRepo, 'main'),
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth',
        ],
      }),
    });

    const stageCrawler = pipeline.addStage(new StageLambdaCrawler(this, 'StageLambdaCrawler'));
  }
}
