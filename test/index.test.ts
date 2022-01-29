import { crawl, CreateAndStoreScreenshotFn, SendEmailFn } from '../src/crawl';
import * as puppeteer from 'puppeteer';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { crawlTemp } from '../src/crawl-temp';

it('temp test', async () => {
  const picsFolder = 'pics';
  if (!existsSync(picsFolder)) mkdirSync(picsFolder);
  const logStep: CreateAndStoreScreenshotFn = async (filename, requestId, page) => {
    const fullFilename = `${picsFolder}/${requestId}-${filename}`
    const screenshot = await page.screenshot();
    writeFileSync(fullFilename, screenshot);

    console.log('Mock Screenshot created:', fullFilename);
  };
  
  await crawlTemp(logStep);
});

it.only('test browser', async () => {
  const picsFolder = 'pics';
  let picNumber = 0;
  if (!existsSync(picsFolder)) mkdirSync(picsFolder);

  const logStep: CreateAndStoreScreenshotFn = async (filename, requestId, page) => {
    const makeFilename = (filename: string) => {
      picNumber++;
      const nulls = new Array(5 - `${picNumber}`.length).join('0');
      return `${nulls}-${filename}.png`;
    };

    const fullFilename = `${picsFolder}/${requestId}-${makeFilename(filename)}`
    const screenshot = await page.screenshot();
    writeFileSync(fullFilename, screenshot);

    console.log('Mock Screenshot created:', fullFilename);
  };

  const sendEmail: SendEmailFn = async () => {};

  await crawl(logStep, sendEmail);
});
