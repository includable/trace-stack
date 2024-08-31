module.exports.handler = async () => {
  console.log("Hello, world!");

  console.info("Let's fetch some data");

  const res = await fetch("https://example.com", {
    method: "POST",
    body: JSON.stringify({ key: "value" }),
  });
  console.log(await res.text());

  console.warn("This is a warning", {
    warning: "yes",
  });

  if (Math.random() > 0.6) {
    throw new Error("Tantrum");
  }

  if (Math.random() > 0.5) {
    throw new SyntaxError("Syntax Error");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ hello: "world" }),
  };
};
