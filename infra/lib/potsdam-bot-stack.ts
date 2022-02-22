import { Stack, StackProps } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { PBotCrawlerStage } from './pbot-crawler-stage';

export interface GithubProps {
  readonly owner: string;
  readonly repository: string;
}

export interface PotsdamBotStackProps extends StackProps {
  readonly github: GithubProps;
}

const getRepositoryString = ({ owner, repository }: GithubProps): string => `${owner}/${repository}`;

export class PotsdamBotStack extends Stack {
  constructor(scope: Construct, id: string, props: PotsdamBotStackProps) {
    super(scope, id, props);

    new Bucket(this, 'test-bucket');

    const pipeline = new CodePipeline(this, 'PBotPipeline', {
      pipelineName: 'PotsdamBot',
      synth: new ShellStep('SynthStep', {
        input: CodePipelineSource.gitHub(getRepositoryString(props.github), 'main'),
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth',
        ],
      }),
    });

    // pipeline.addStage(new PBotCrawlerStage(this, 'PBotCrawlerStage'));
  }
}
