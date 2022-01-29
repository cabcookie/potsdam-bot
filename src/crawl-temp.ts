import { writeFileSync } from "fs";
import * as puppeteer from "puppeteer";
import { callUrl, CreateAndStoreScreenshotFn, flowItems } from "./crawl";

export const crawlTemp = async (createAndStoreScreenshot: CreateAndStoreScreenshotFn) => {
  const requestId = new Date().toISOString().substring(0,19).replace(/-/g, "").replace(/:/g, "");
  let picNumber = 0;
  console.log('Request ID:', requestId);
  
  const makeFilename = (filename: string) => {
    picNumber++;
    const nulls = new Array(5 - `${picNumber}`.length).join('0');
    return `${nulls}-${filename}.png`;
  };

  const testPages = [
    '000-kalender',
    '001-termin ausgewählt',
    '002-namen eingeben',
    '003-auswahl bestätigen',
    '004-der termin ist bereits vergeben',
    '005-kalender zeigt zuvor ausgewählten termin',
  ];
  const currentTestPage = 4;
  const potsdamUrl = `file:///Users/carskoch/Development/potsdam-bot/temp/${testPages[currentTestPage]}.html`;
  console.log(`URL: ${potsdamUrl}`);

  const config = [{
    service: 'Beantragung eines Personalausweises',
    items: 1,
  }];

  const { page, browser } = await callUrl(potsdamUrl);
  
  const warning = await page.$(flowItems.messageMeetingSlotBookedAlready);
  console.log('Warning', warning);
  

  const html = await page.$eval('*', (element) => element.outerHTML);
  await writeFileSync('temp/temp.html', html);
  await createAndStoreScreenshot(makeFilename('temp'), requestId, page);

  await page.close();
  await browser.close();
};
