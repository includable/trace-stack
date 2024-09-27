export const handler = async (event) => {
  console.log(event);

  if (event.action === "error-timeout") {
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }

  if (event.action === "error-memory") {
    let x = 0,
      z = 0,
      y = [];
    while (x < 1024 * 1024) {
      while (z < 1024 * 1024) {
        y.push(new Array(1024 * 1024 * 1024).fill(0));
        z++;
      }
      x++;
    }
  }

  if (event.action === "error-throw") {
    throw new Error("Error thrown");
  }
};
