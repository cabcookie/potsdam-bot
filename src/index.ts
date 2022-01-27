import { Context } from 'aws-lambda';
// import { createTransport } from 'nodemailer';
import { S3 } from "aws-sdk";
import * as puppeteer from 'puppeteer';

export const lambdaHandler = async (event: any, context: Context) => {
  const region = process.env.REGION;
  const email = process.env.EMAIL;
  const bucketName = process.env.BUCKETNAME;
  
  // let browser;
  
  try {
    if (!region) throw new Error('Region was not provided');
    if (!email) throw new Error('Email address was not provided');
    if (!bucketName) throw new Error('Bucket name was not provided');
    
    const requestId = new Date().toISOString().substring(0,19).replace(/-/g, "").replace(/:/g, "");
    let picNumber = 0;
    console.log('Request ID:', requestId);
    
    const config = [
      'Beantragung eines Reisepasses',
      'Beantragung eines Personalausweises',
    ];
    
    const potsdamUrl = 'https://egov.potsdam.de/tnv/?START_OFFICE=buergerservice';
    console.log(`URL: ${potsdamUrl}`);

    console.log('Start S3 Service...');    
    const s3 = new S3();

    // const transporter = createTransport({
    //   SES: new SES(),
    // });

    const createAndStoreScreenshot = async (filename: string, page: puppeteer.Page) => {
      const screenshot = await page.screenshot({ fullPage: true }) as Buffer;
      picNumber++;
      const nulls = new Array(5 - `${picNumber}`.length).join('0');
      const fullFilename = `${requestId}/${nulls}-${filename}.png`;
      console.log('Screenshot created:', fullFilename);
      
      await s3.putObject({
        Bucket: bucketName,
        Key: fullFilename,
        Body: screenshot,
        ContentType: 'image/png'
      }).promise();
      console.log(`Screenshot stored on S3: ${bucketName}/${fullFilename}`);
    };

    let attempt = 0;
    do {
      attempt++;
      console.log(`${attempt}${attempt == 1 ? 'st' : attempt == 2 ? 'nd' : attempt == 3 ? 'rd' : 'th'} attempt...`);

      try {
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
        await createAndStoreScreenshot('homepage', page);
        
        await page.waitForSelector('h3.ekolSegmentBox1');

        await page.close();
        await browser.close();
        

        // const result = await transporter.sendMail({
        //   from: email,
        //   subject: 'Nachricht vom PotsdamBot',
        //   text: 'Details folgen bald',
        //   to: email,
        //   attachments: [{
        //     filename: homepage.filename,
        //     content: homepage.content || '',
        //   }],
        // });

        return {
          statusCode: 200,
          body: 'Successfully loaded page and handled all transactions.',
        };
      } catch (error) {
        if (attempt == 3) throw error;
        console.log('Error:', error);
        console.log('Trying again...');
      };
    } while (attempt <= 3)
    
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

  return {
    statusCode: 403,
    body: 'Something went wrong. Internal unindentified error.',
  }
}