import { Context } from 'aws-lambda';
import { S3, SES } from "aws-sdk";
import * as puppeteer from 'puppeteer';
import { crawl, CreateAndStoreScreenshotFn, SendEmailFn } from './crawl';
import { emptyFolder } from './empty-folder';

const CHARSET = 'UTF-8';

export interface IServicesToBook {
  service: string;
  items: number;
}

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
  /**
   * For the moment, we store the basic information about who wants to book
   * and what this person wants to book here in the code. Our aim is to
   * have defined by a user on a landing page and be stored in a DynamoDB.
   */
  const registrantLastName = 'Lange';
  const servicesToBook = [{
    service: 'Beantragung eines Personalausweises',
    items: 1,
  }, {
    service: 'Beantragung eines Reisepasses',
    items: 1,
  }] as IServicesToBook[];

  // Get the current AWS Region, the sender Email address and the S3 bucket for the screenshots from the Lambda's environment variable
  const region = process.env.REGION;
  const email = process.env.EMAIL;
  const bucketName = process.env.BUCKET;
  let picNumber = 0;
  
  try {
    // If the environment variables are not provided the crawler can not succeed!
    if (!region) throw new Error('Region was not provided');
    if (!email) throw new Error('Email address was not provided');
    if (!bucketName) throw new Error('Bucket name was not provided');

    console.log('Start S3 Service...');    
    const s3 = new S3();

    const createAndStoreScreenshot: CreateAndStoreScreenshotFn = async (filename: string, requestId: string, page: puppeteer.Page) => {
      const makeFilename = (filename: string) => {
        picNumber++;
        const nulls = new Array(4 - `${picNumber}`.length).join('0');
        return `${nulls}${picNumber}-${filename}.png`;
      };
          
      const fullFilename = `pictures/${requestId}-${makeFilename(filename)}`;
      const screenshot = await page.screenshot({ fullPage: true }) as Buffer;
      console.log('Screenshot created:', filename);
      
      await s3.putObject({
        Bucket: bucketName,
        Key: fullFilename,
        Body: screenshot,
        ContentType: 'image/png'
      }).promise();
      console.log(`Screenshot stored: ${bucketName}/${fullFilename}`);

      return {
        screenshot,
        fileName: fullFilename,
      };
    };

    // Try up to three times to crawl the page
    let attempt = 0;
    do {
      attempt++;
      console.log(`${attempt}${attempt == 1 ? 'st' : attempt == 2 ? 'nd' : attempt == 3 ? 'rd' : 'th'} attempt...`);

      try {
        // Crawl the web page and try to book and appointment
        await crawl(createAndStoreScreenshot, registrantLastName, servicesToBook, sendEmail);

        // Delete the chromium and puppeteer temp files
        emptyFolder('/tmp');

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
    emptyFolder('/tmp');

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