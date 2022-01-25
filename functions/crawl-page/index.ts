import axios from 'axios';
import cheerio from 'cheerio';

const potsdamUrl = 'https://egov.potsdam.de/tnv/?START_OFFICE=buergerservice';

exports.handler = async () => {
  const result = await axios(potsdamUrl);
  const html = cheerio.load(result.data);

  const logMessage = {
    message: "Hello from Lambda",
    result: result.data,
    html,
  };
  console.log("Result", JSON.stringify(logMessage));

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/json" },
    body: JSON.stringify(logMessage),
  }
}