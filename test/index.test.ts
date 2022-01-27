import { crawl, CreateAndStoreScreenshotFn } from '../src/crawl';
import * as puppeteer from 'puppeteer';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

it('test browser', async () => {
  const picsFolder = 'pics';
  if (!existsSync(picsFolder)) mkdirSync(picsFolder);
  const logStep: CreateAndStoreScreenshotFn = async (filename, requestId, page) => {
    const fullFilename = `${picsFolder}/${requestId}-${filename}`
    const screenshot = await page.screenshot();
    writeFileSync(fullFilename, screenshot);

    console.log('Mock Screenshot created:', fullFilename);
  };
  await crawl(logStep);
});
