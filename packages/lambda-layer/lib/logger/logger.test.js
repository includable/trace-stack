jest.mock("node-fetch");
const fetch = require("node-fetch");

const initLogger = require("./index.js");

describe("logger", () => {
  let logger;

  beforeAll(() => {
    logger = initLogger();
  });

  beforeEach(() => {
    // @ts-ignore
    fetch.mockClear();
  });

  afterAll(() => {
    logger.stop();
  });

  it("should send logs", async () => {
    console.log("Hello, world!");

    await logger.flushQueue();
    expect(fetch).toHaveBeenCalledTimes(1);

    // @ts-ignore
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body).toHaveLength(1);
    expect(body[0].log).toBe('{"0":"Hello, world!"}');
  });

  it("flushes logs when the queue is full", async () => {
    for (let i = 0; i < 120; i++) {
      console.log("Hello, world!");
    }

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
