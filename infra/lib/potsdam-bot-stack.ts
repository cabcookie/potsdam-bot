import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';

import { PBotCrawlerStage } from './pbot-crawler-stage';

export interface PotsdamBotStackProps extends StackProps {
  readonly githubRepositoryOwner: string;
  readonly githubRepositoryName: string;
}

const getRepositoryString = (pipelineStackProps: PotsdamBotStackProps): string => {
  return `${pipelineStackProps.githubRepositoryOwner}/${pipelineStackProps.githubRepositoryName}`;
};

export class PotsdamBotStack extends Stack {
  constructor(scope: Construct, id: string, props: PotsdamBotStackProps) {
    super(scope, id, props);

    console.log('Github repository:', getRepositoryString(props));
    
    const pipeline = new CodePipeline(this, 'PBotPipeline', {
      pipelineName: 'PotsdamBot',
      synth: new ShellStep('SynthStep', {
        input: CodePipelineSource.gitHub(getRepositoryString(props), 'main'),
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth',
        ],
      }),
    });


    pipeline.addStage(new PBotCrawlerStage(this, 'PBotCrawlerStage'));
  }
}
