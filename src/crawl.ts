import { config } from "process";
import * as puppeteer from "puppeteer";

const flowItems = {
  buttonTerminVereinbaren: '#action_officeselect_termnew_prefix1333626470',
  servicesSelection: '#id_abstractcontexttnv_mdg-input-anliegen-ohne-dauer .blockcontentdatagrid .ui-field-contain',
  buttonConfirmSelectedServices: '#action_concernselect_next',
  buttonConfirmCommentsRead: '#action_concerncomments_next',

  _nextPageLoaded: 'h3.ekolSegmentBox1',
};

const requestId = new Date().toISOString().substring(0,19).replace(/-/g, "").replace(/:/g, "");
let picNumber = 0;
console.log('Request ID:', requestId);

const makeFilename = (filename: string) => {
  picNumber++;
  const nulls = new Array(5 - `${picNumber}`.length).join('0');
  return `${nulls}-${filename}.png`;
};

const getIdFromSelectElement = async (element: puppeteer.ElementHandle) => {
  const outerReplace = '<select name="';
  const innerReplace = /" id="id_[0-9]+"><\/select>/;

  const outerHTML = await element.$eval('select', (outerNode) => outerNode.outerHTML);
  const innerHTML = await element.$eval('select', (innernode) => innernode.innerHTML);

  return outerHTML.replace(innerHTML, '').replace(outerReplace, '').replace(innerReplace, '');
}

interface ServiceAttributes {
  id: string;
  service: string;
};

type MapServicesFn = (element: puppeteer.ElementHandle) => Promise<ServiceAttributes>;

const mapServices: MapServicesFn = async (element) => {
  const service = await element.$eval('label', (node) => node.textContent) as string;
  const id = await getIdFromSelectElement(element);
  return { service, id };
};

export type CreateAndStoreScreenshotFn = (filename: string, requestId: string, page: puppeteer.Page) => void

export const crawl = async (createAndStoreScreenshot: CreateAndStoreScreenshotFn) => {
  const potsdamUrl = 'https://egov.potsdam.de/tnv/?START_OFFICE=buergerservice';
  console.log(`URL: ${potsdamUrl}`);

  const config = [{
    service: 'Beantragung eines Reisepasses',
    items: 1,
  },{
    service: 'Beantragung eines Personalausweises',
    items: 1,
  }];

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
  await page.click(flowItems.buttonTerminVereinbaren);
  await page.waitForSelector(flowItems._nextPageLoaded);

  const services = await page.$$(flowItems.servicesSelection);

  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const mappedService = await mapServices(service);
    
    const configItem = config.filter((config) => config.service == mappedService.service);
    if (configItem.length > 0) {
      await page.select(`#id_${mappedService.id}`, `${configItem[0].items}`);
    }
  }
  
  await page.click(flowItems.buttonConfirmSelectedServices);
  await page.waitForSelector(flowItems._nextPageLoaded);

  // TODO: Collect the links with information about preparing the meeting

  await page.click(flowItems.buttonConfirmCommentsRead);
  await page.waitForSelector(flowItems._nextPageLoaded);

  await createAndStoreScreenshot(makeFilename('homepage'), requestId, page);

  await page.close();
  await browser.close();
};
