import { Context } from 'aws-lambda';
import { createTransport } from 'nodemailer';
import { S3, SES } from "aws-sdk";
import * as puppeteer from 'puppeteer';
import { crawl, CreateAndStoreScreenshotFn, SendEmailFn } from './crawl';

const CHARSET = 'UTF-8';

const sendEmail = (email: string, region: string): SendEmailFn => async (subject: string, text: string) => {
  console.log('Prepare Email:', { subject, text, email, region });

  const ses = new SES({ region });
  const params = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Text: {
          Data: text,
          Charset: CHARSET,
        },
      },
      Subject: {
        Data: subject,
        Charset: CHARSET,
      },
    },
    Source: email,
  };

  console.log('Send email.');
    
  const result = await ses.sendEmail(params).promise();
  console.log('Email Result', result);
};

export const lambdaHandler = async (event: any, context: Context) => {
  const region = process.env.REGION;
  const email = process.env.EMAIL;
  const bucketName = process.env.BUCKET;
  let picNumber = 0;
  
  try {
    if (!region) throw new Error('Region was not provided');
    if (!email) throw new Error('Email address was not provided');
    if (!bucketName) throw new Error('Bucket name was not provided');
        
    console.log('Start S3 Service...');    
    const s3 = new S3();

    const createAndStoreScreenshot: CreateAndStoreScreenshotFn = async (filename: string, requestId: string, page: puppeteer.Page) => {
      const makeFilename = (filename: string) => {
        picNumber++;
        const nulls = new Array(5 - `${picNumber}`.length).join('0');
        return `${nulls}-${filename}.png`;
      };
          
      const fullFilename = `${requestId}/${makeFilename(filename)}`;
      const screenshot = await page.screenshot({ fullPage: true }) as Buffer;
      console.log('Screenshot created:', fullFilename);
      
      await s3.putObject({
        Bucket: bucketName,
        Key: fullFilename,
        Body: screenshot,
        ContentType: 'image/png'
      }).promise();
      console.log(`Screenshot stored on S3: ${bucketName}/${fullFilename}`);

      return screenshot;
    };

    let attempt = 0;
    do {
      attempt++;
      console.log(`${attempt}${attempt == 1 ? 'st' : attempt == 2 ? 'nd' : attempt == 3 ? 'rd' : 'th'} attempt...`);

      try {
        await crawl(createAndStoreScreenshot, sendEmail);

        return {
          statusCode: 200,
          body: 'Successfully loaded page and handled all transactions.',
        };
      } catch (error) {
        if (attempt == 3) throw error;
        console.log('Error:', error);
        console.log('Trying again...');
      };
    } while (attempt <= 3)
    
  } catch (error) {
    console.log('ERROR:', error);
    if (error instanceof Error) {
      return JSON.stringify({
        body: { error: error.message },
        statusCode: 400,
      });
    } 
    return JSON.stringify({
      body: { error: JSON.stringify(error) },
      statusCode: 400,
    });
  }

  return {
    statusCode: 403,
    body: 'Something went wrong. Internal unindentified error.',
  }
}