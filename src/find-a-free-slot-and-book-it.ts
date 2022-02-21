import * as puppeteer from "puppeteer";
import { CreateAndStoreScreenshotFn, flowItems } from "./crawl";

const getFreeTimes = async (createAndStoreScreenshot: CreateAndStoreScreenshotFn, registrantLastName: string, page: puppeteer.Page, requestId: string) => {
  let freeTimesLength = -1;
  let freeTimeIndex = 0;
  
  do {
    freeTimeIndex++;

    const freeTimes = await page.$$(flowItems.findFreeTimes);
    if (freeTimesLength == -1) freeTimesLength = freeTimes.length;
    if (freeTimesLength == 0) throw 'No free times found on this date';
    
    const pickFreeTime = freeTimes[freeTimesLength - freeTimeIndex];
    const properties = await pickFreeTime.getProperties();
    
    let text = '';
    let value = '';
    
    for (const property of properties.values()) {
      const propElement = property.asElement();
      if (propElement) {
        const hText = await propElement.getProperty('text');
        text = await hText.jsonValue();
        const hValue = await propElement.getProperty('value');
        value = await hValue.jsonValue();
      }
    }
    
    const selectedFreetime = { text, value };
    console.log('Selected free time:', selectedFreetime.text);
    
    await page.select(flowItems.findFreeTimes, selectedFreetime.value);
    
    const buttonConfirmSelection = await page.$(flowItems.confirmTimeSelection);
    buttonConfirmSelection?.click();
    await page.waitForSelector(flowItems._nextPageLoaded);

    await createAndStoreScreenshot('confirm-date-time-selection', requestId, page);

    await page.type(flowItems.inputLastName, registrantLastName, { delay: 20 });
    await page.click(flowItems.confirmRegistrationName);
    await page.waitForNavigation();

    await page.click(flowItems.bookMeetingSlot);
    await page.waitForNavigation();
    
    const warningMessage = await page.$(flowItems.messageMeetingSlotBookedAlready);
    if (!warningMessage) return true;

  } while (freeTimeIndex < freeTimesLength)
  return false;
};

export const findFreeSlotAndBookIt = async (createAndStoreScreenshot: CreateAndStoreScreenshotFn, registrantLastName: string, page: puppeteer.Page, requestId: string) => {
  let freeSlotsLength = -1;
  let dateSlot = -1;

  do {
    dateSlot++
    const freeSlots = await page.$$(flowItems.findFreeDates);
    if (freeSlotsLength == -1) freeSlotsLength = freeSlots.length;
    if (freeSlotsLength == 0) throw 'ERROR: No free slots found!';
    await page.waitForSelector(flowItems._nextPageLoaded);

    await freeSlots[dateSlot].click();
    await page.waitForSelector(flowItems._nextPageLoaded);
    await createAndStoreScreenshot('free-slots', requestId, page);

    try {
      const dateTimeFound = await getFreeTimes(createAndStoreScreenshot, registrantLastName, page, requestId);
      if (dateTimeFound) return true;

    } catch (error) {
      console.log(error);
      
    }
  } while (dateSlot < freeSlotsLength)
  return false;
};