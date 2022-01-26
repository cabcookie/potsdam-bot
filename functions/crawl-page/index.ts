import { existsSync, mkdirSync } from "fs";
import { launch, Page } from 'puppeteer';

const potsdamUrl = 'https://egov.potsdam.de/tnv/?START_OFFICE=buergerservice';
const baseDir = '/tmp/pics'
if (!existsSync(baseDir)) mkdirSync(baseDir);

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
  const fullFilename = `${baseDir}/${dateStr}-${nulls}${picNumber}-${filename}.png`;
  if (picNumber == 1) {
    filenameFirstPicture = fullFilename;
  }

  await page.screenshot({ path: fullFilename});
  console.log("Screenshot created:", fullFilename);
};

export const handler = async () => {
  const region = process.env.REGION;
  const email = process.env.EMAIL;
  
  try {
    if (!region) throw new Error('Region was not provided');
    if (!email) throw new Error('Email address wan not provided');

    const browser = await launch();
    const page = await browser.newPage();

    await page.goto(potsdamUrl);
    await createScreenshot(page, 'homepage');

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