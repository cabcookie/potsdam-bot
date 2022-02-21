import { crawl, CreateAndStoreScreenshotFn, SendEmailFn } from '../src/crawl';
import * as puppeteer from 'puppeteer';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

it('test browser', async () => {
  const picsFolder = 'pics';
  let picNumber = 0;
  if (!existsSync(picsFolder)) mkdirSync(picsFolder);

  const logStep: CreateAndStoreScreenshotFn = async (filename, requestId, page) => {
    const makeFilename = (filename: string) => {
      picNumber++;
      const nulls = new Array(4 - `${picNumber}`.length).join('0');
      return `${nulls}${picNumber}-${filename}.png`;
    };

    const fullFilename = `${picsFolder}/${requestId}-${makeFilename(filename)}`
    const screenshot = await page.screenshot();
    writeFileSync(fullFilename, screenshot);

    console.log('Mock Screenshot created:', fullFilename);
  };

  const sendEmail: SendEmailFn = async () => {};

  await crawl(logStep, 'Schmidt-Herzog', [{
    service: 'Beantragung eines Personalausweises',
    items: 1,
  }], sendEmail);
});
