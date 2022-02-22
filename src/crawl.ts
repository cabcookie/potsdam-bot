import * as puppeteer from "puppeteer";
import { IServicesToBook } from ".";
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

export interface IScreenshotWithMetadata {
  screenshot: Buffer;
  fileName: string;
}
export type CreateAndStoreScreenshotFn = (filename: string, requestId: string, page: puppeteer.Page) => void | Promise<IScreenshotWithMetadata> | Promise<void>;
export type SendEmailFn = (subject: string, text: string) => void;

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

export const crawl = async (createAndStoreScreenshot: CreateAndStoreScreenshotFn, registrantLastName:string, servicesToBook: IServicesToBook[], emailer: SendEmailFn) => {
  const bucketName = process.env.BUCKET;
  const region = process.env.REGION;

  const requestId = new Date().toISOString().substring(0,19).replace(/-/g, "").replace(/:/g, "");
  console.log('Request ID:', requestId);
  
  const potsdamUrl = 'https://egov.potsdam.de/tnv/?START_OFFICE=buergerservice';
  const { page, browser } = await callUrl(potsdamUrl);

  // Click the button "Termin vereinbaren"
  await page.click(flowItems.buttonTerminVereinbaren);
  await page.waitForSelector(flowItems._nextPageLoaded);

  // Get a list of all available services
  const services = await page.$$(flowItems.servicesSelection);

  // Iterate through the list of services and select the requested number of items
  for (let i = 0; i < services.length; i++) {
    const service = services[i];

    // For the current service get the label name and the id of the HTML element
    const mappedService = await mapServices(service);
    
    // Verify if the service is requested for booking by the user
    const configItem = servicesToBook.filter((serviceToBook) => serviceToBook.service == mappedService.service);
    if (configItem.length > 0) {
      // The user requested to book this service. Now, do it
      await page.select(`#id_${mappedService.id}`, `${configItem[0].items}`);
    }
  }
  
  // Confirm the list of selected services
  await page.click(flowItems.buttonConfirmSelectedServices);
  await page.waitForSelector(flowItems._nextPageLoaded);

  // The page shows us additional information and pre-requisites for the services
  // This will be shown at the end on the confirmation page as well. Thus,
  // we can ignore it here.
  await page.click(flowItems.buttonConfirmCommentsRead);
  await page.waitForSelector(flowItems._nextPageLoaded);

  // Make a screenshot of the calendar with its available slots
  await createAndStoreScreenshot('calendar', requestId, page);
  

  try {
    // From the available slots, try to book one; returns if booking a slot was successful
    const result = await findFreeSlotAndBookIt(createAndStoreScreenshot, registrantLastName, page, requestId);

    if (result) {
      // Booking a slot was successful; so make a screenshot of the confirmation page
      // and send an Email
      const { fileName } = await createAndStoreScreenshot('confirmation', requestId, page) as IScreenshotWithMetadata;
      await emailer(
        'Bürgerservice Potsdam - Termin gebucht',
        `Es konnte erfolgreich ein Termin gebucht werden. Bitte informiere Dich über die Potsdam-Homepage, wie du den Termin optimal vorbereiten kannst. Ein Screenshot von der Anmeldebestätigung wurde in S3 gespeichert: https://s3.console.aws.amazon.com/s3/object/${bucketName}?region=${region}&prefix=${fileName}`
      );
    }
  } catch (error) {
    console.log('ERROR:', error);

  }

  // Create a final screenshot and close the crawler
  await createAndStoreScreenshot('final-page', requestId, page);
  await page.close();
  await browser.close();
  console.log('Page and browser closed.');
};
