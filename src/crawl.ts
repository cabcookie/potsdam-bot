import * as puppeteer from "puppeteer";

const requestId = new Date().toISOString().substring(0,19).replace(/-/g, "").replace(/:/g, "");
let picNumber = 0;
console.log('Request ID:', requestId);

const makeFilename = (filename: string) => {
  picNumber++;
  const nulls = new Array(5 - `${picNumber}`.length).join('0');
  return `${nulls}-${filename}.png`;
};

export type CreateAndStoreScreenshotFn = (filename: string, requestId: string, page: puppeteer.Page) => void

export const crawl = async (createAndStoreScreenshot: CreateAndStoreScreenshotFn) => {
  const potsdamUrl = 'https://egov.potsdam.de/tnv/?START_OFFICE=buergerservice';
  console.log(`URL: ${potsdamUrl}`);

  console.log('Launch browser...');
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process'
    ]
  });

  const browserVersion = await browser.version()
  console.log(`Started ${browserVersion}`);
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  await page.setViewport({ width: 1920, height: 1080 });
  
  await page.goto(potsdamUrl);
  await page.click('#action_officeselect_termnew_prefix1333626470');
  await createAndStoreScreenshot(makeFilename('homepage'), requestId, page);

  await page.close();
  await browser.close();
};
