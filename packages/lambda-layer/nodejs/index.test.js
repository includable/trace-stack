const index = require("./dist/auto_tracer_wrapper.js");

describe("tracer", () => {
  beforeEach(() => {
    process.env[index.LUMIGO_SWITCH_OFF] = "TRUE";
  });

  it("should call original handler", async () => {
    process.env.TRACER_ORIGINAL_HANDLER = `${__dirname}/testdata/example_handler.my_handler`;
    await expect(index.handler({}, {})).resolves.toEqual({
      hello: "world",
    });
  });

  it("should error if no handler is specified", async () => {
    process.env.TRACER_ORIGINAL_HANDLER = undefined;
    await expect(index.handler({}, {})).rejects.toThrow();
  });

  it("should error if invalid handler is specified", async () => {
    process.env.TRACER_ORIGINAL_HANDLER = "bad/handler/format";
    await expect(index.handler({}, {})).rejects.toThrow();
  });
  it("should error if non-existing handler is specified", async () => {
    process.env.TRACER_ORIGINAL_HANDLER = "not-existing.handler";
    await expect(index.handler({}, {})).rejects.toThrow();
  });
});
