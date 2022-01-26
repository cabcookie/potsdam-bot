import chromium from 'chrome-aws-lambda';
import { createTransport } from 'nodemailer';
import { SES } from "aws-sdk";
import { Page } from "puppeteer-core";

const potsdamUrl = 'https://egov.potsdam.de/tnv/?START_OFFICE=buergerservice';

const dateStr = new Date().toISOString().substring(0,16).replace(/-/g, "").replace(/:/g, "");
let picNumber = 0;
let filenameFirstPicture = '';

const config = [
  'Beantragung eines Reisepasses',
  'Beantragung eines Personalausweises',
];

const createScreenshot = async (page: Page, filename: string) => {
  picNumber++;
  const lengthId = 5 - ` ${picNumber}`.length;
  const nulls = new Array(lengthId).join('0');
  const fullFilename = `${dateStr}-${nulls}${picNumber}-${filename}.png`;
  if (picNumber == 1) {
    filenameFirstPicture = fullFilename;
  }

  return {
    filename: fullFilename,
    content: await page.screenshot(),
  };
};

export const handler = async () => {
  const region = process.env.REGION;
  const email = process.env.EMAIL;
  
  try {
    if (!region) throw new Error('Region was not provided');
    if (!email) throw new Error('Email address wan not provided');

    const transporter = createTransport({
      SES: new SES(),
    });

    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      executablePath: await chromium.executablePath,
    });
    const page = await browser.newPage();
    
    await page.goto(potsdamUrl);
    const homepage = await createScreenshot(page, 'homepage');
    
    const result = await transporter.sendMail({
      from: email,
      subject: 'Nachricht vom PotsdamBot',
      text: 'Details folgen bald',
      to: email,
      attachments: [{
        filename: homepage.filename,
        content: homepage.content || '',
      }],
    });

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
  }
}