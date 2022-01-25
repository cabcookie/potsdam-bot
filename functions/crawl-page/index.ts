exports.handler = async () => {
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