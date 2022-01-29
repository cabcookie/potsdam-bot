import * as puppeteer from "puppeteer";
import { findFreeSlotAndBookIt } from "./find-a-free-slot-and-book-it";

export interface IFlowItems {
  [key: string]: string;
};

export const flowItems: IFlowItems = {
  buttonTerminVereinbaren: '#action_officeselect_termnew_prefix1333626470',
  servicesSelection: '#id_abstractcontexttnv_mdg-input-anliegen-ohne-dauer .blockcontentdatagrid .ui-field-contain',
  buttonConfirmSelectedServices: '#action_concernselect_next',
  buttonConfirmCommentsRead: '#action_concerncomments_next',
  findFreeDates: '.ekolCalendarMonthTable tbody td.eKOLCalendarCellInRange button.eKOLCalendarButtonDayFreeX,button.eKOLCalendarButtonDayTimeUsed',
  findFreeTimes: '#ekolcalendartimeselectbox',
  findFreeTimesOptions: '#ekolcalendartimeselectbox option',
  confirmTimeSelection: '#ekolcalendarpopupdayauswahlbuttoncontainer',
  closePopUpWindow: '.ekolstaticpopup .messagebox_buttonclosecontainer button',
  inputLastName: 'input[name=NACHNAME]',
  confirmRegistrationName: '#action_userdata_next',
  bookMeetingSlot: '#action_confirm_next',
  messageMeetingSlotBookedAlready: '.uiMessageAdvancedInfo ul#infomsglist li',

  _nextPageLoaded: 'h3.ekolSegmentBox1',
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

export type CreateAndStoreScreenshotFn = (filename: string, requestId: string, page: puppeteer.Page) => void | Promise<Buffer> | Promise<void>;
export type SendEmailFn = (subject: string, text: string, attachments: Buffer[]) => void;

export const callUrl = async (url: string) => {
  console.log(`URL: ${url}`);

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
  
  await page.goto(url);

  return { browser, page };
}


export const crawl = async (createAndStoreScreenshot: CreateAndStoreScreenshotFn, emailer: SendEmailFn) => {
  const requestId = new Date().toISOString().substring(0,19).replace(/-/g, "").replace(/:/g, "");
  console.log('Request ID:', requestId);

  const config = [{
    service: 'Beantragung eines Reisepasses',
    items: 1,
  },{
    service: 'Beantragung eines Personalausweises',
    items: 1,
  }];
  
  const potsdamUrl = 'https://egov.potsdam.de/tnv/?START_OFFICE=buergerservice';
  const { page, browser } = await callUrl(potsdamUrl);

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

  await page.click(flowItems.buttonConfirmCommentsRead);
  await page.waitForSelector(flowItems._nextPageLoaded);

  await createAndStoreScreenshot('calendar', requestId, page);
  
  // TODO: Collect the links with information about preparing the meeting
  
  try {
    const result = await findFreeSlotAndBookIt(createAndStoreScreenshot, page, requestId);
    if (result) {
      const screenshot = await createAndStoreScreenshot('confirmation', requestId, page);
      emailer('Bürgerservice Potsdam - Termin gebucht', 'Es konnte erfolgreich ein Termin gebucht werden. Bitte informiere Dich über die Potsdam-Homepage, wie du den Termin optimal vorbereiten kannst.', [screenshot as Buffer]);
    }
  } catch (error) {
    console.log('ERROR:', error);

  }

  await createAndStoreScreenshot('final-page', requestId, page);
  await page.close();
  await browser.close();
};
