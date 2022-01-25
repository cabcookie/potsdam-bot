import { S3 } from 'aws-sdk';

const potsdamUrl = 'https://egov.potsdam.de/tnv/?START_OFFICE=buergerservice';
const s3Upload = (fileName: string, content: string) => {
  const bucket = new S3();
  bucket.upload({
    Bucket: process.env.BUCKETNAME || 'test-bucket-87654',
    Key: fileName,
    Body: content,
  }, (err, data) => {
    if (err) throw err;
    console.log(`File uploaded successfully: ${data.Location}`);
  });
};

exports.handler = async () => {
  if (!process.env.BUCKETNAME) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/json" },
      body: JSON.stringify({
        error: 'ERROR: BUCKETNAME is not defined as an environment variable',
      }),
    };
  };

  s3Upload('helloworld.json', 'Hello World!');

  const logMessage = {
    message: "Hello from Lambda",
  };
  console.log("Result", JSON.stringify(logMessage));

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/json" },
    body: JSON.stringify(logMessage),
  }
}