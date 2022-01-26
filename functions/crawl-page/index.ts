import chromium from 'chrome-aws-lambda';
// import { createTransport } from 'nodemailer';
import { SES, S3 } from "aws-sdk";
// import { Page } from "puppeteer-core";

const potsdamUrl = 'https://egov.potsdam.de/tnv/?START_OFFICE=buergerservice';

const makeFilename = (topic: string) => `${new Date().toISOString().substring(0,16).replace(/-/g, "").replace(/:/g, "")}-${topic}.png`;

const config = [
  'Beantragung eines Reisepasses',
  'Beantragung eines Personalausweises',
];

export const handler = async () => {
  const region = process.env.REGION;
  const email = process.env.EMAIL;
  const bucketName = process.env.BUCKETNAME;
  
  let browser;

  try {
    if (!region) throw new Error('Region was not provided');
    if (!email) throw new Error('Email address was not provided');
    if (!bucketName) throw new Error('Bucket name was not provided');

    console.log('Start S3 Service...');    
    const s3 = new S3({apiVersion: '2006-03-01'});

    // const transporter = createTransport({
    //   SES: new SES(),
    // });

    console.log('Launching puppeteer...');
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      executablePath: await chromium.executablePath,
    });

    console.log('Open new page...');
    const page = await browser.newPage();
    
    console.log(`Open webpage '${potsdamUrl}'...`);
    await page.goto(potsdamUrl);

    console.log('Create a screenshot');
    const screenshot = await page.screenshot();

    console.log('Upload screenshot to S3...');    
    const s3Result = await s3.upload({
      Bucket: bucketName,
      Key: makeFilename('homepage'),
      Body: screenshot || '',
      ContentType: 'image/png',
    }).promise();
    console.log('Screenshot URL:', s3Result.Location);
    
    console.log('Closing the page and the browser...');
    await page.close();
    await browser.close();
    
    // const result = await transporter.sendMail({
    //   from: email,
    //   subject: 'Nachricht vom PotsdamBot',
    //   text: 'Details folgen bald',
    //   to: email,
    //   attachments: [{
    //     filename: homepage.filename,
    //     content: homepage.content || '',
    //   }],
    // });

    const logMessage = {
      statusCode: 200,
      body: { message: 'Screensshot successfully created.' },
    }
    console.log(logMessage);

    return JSON.stringify(logMessage);

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
  } finally {
    console.log('Close the browser if still open...');
    await browser?.close();
  }
}