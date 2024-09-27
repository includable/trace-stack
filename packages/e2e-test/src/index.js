export const handler = async (event) => {
  console.log(event);

  if (event.action === "error-timeout") {
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }

  if (event.action === "error-memory") {
    let array = [];
    while (true) {
      array.push(Buffer.alloc(1024 * 1024));
    }
    console.log("error-memory");
  }

  if (event.action === "error-throw") {
    throw new Error("Error thrown");
  }
};
