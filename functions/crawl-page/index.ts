import { SES } from "aws-sdk";
import { SendEmailRequest } from "aws-sdk/clients/ses";
import { existsSync, mkdirSync, readFileSync, readSync } from "fs";
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

export type ContactDetails = {
  name: string;
  email: string;
  message: string;
};

const getHtmlContent = ({name, email, message}: ContactDetails) => {
  return `
    <html>
      <body>
        <h1>Received an Email. 📬</h1>
        <h2>Sent from: </h2>
        <ul>
          <li style="font-size:18px">👤 <b>${name}</b></li>
          <li style="font-size:18px">✉️ <b>${email}</b></li>
        </ul>
        <p style="font-size:18px">${message}</p>
      </body>
    </html> 
  `;
}

const getTextContent = ({name, email, message}: ContactDetails) => {
  return `
    Received an Email. 📬
    Sent from:
        👤 ${name}
        ✉️ ${email}
    ${message}
  `;
}
const sendEmailParams = ({ name, email, message }: ContactDetails): SendEmailRequest => {
  return {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: 'Nachricht vom PotsdamBot',
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: getHtmlContent({ name, email, message }),
        },
        Text: {
          Charset: 'UTF-8',
          Data: getTextContent({ name, email, message }),
        },
      },
    },
    Source: email,
  }
};

const sendEmail = async (region: string, email: string, message: string) => {
  const ses = new SES({ region });
  await ses.sendEmail(sendEmailParams({
    name: 'PotsdamBot',
    email,
    message,
  })).promise();

  const logMessage = {
    body: { message: 'Email sent successfully 🎉🎉🎉' },
    statusCode: 200,
  };
  console.log(logMessage);
  
  return JSON.stringify(logMessage);
};

exports.handler = async () => {
  const region = process.env.REGION;
  const email = process.env.EMAIL;
  
  try {
    if (!region) throw new Error('Region was not provided');
    if (!email) throw new Error('Email address wan not provided');

    const browser = await launch();
    const page = await browser.newPage();

    await page.goto(potsdamUrl);
    await createScreenshot(page, 'homepage');

    return await sendEmail(region, email, 'This is my awesome test message!');

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