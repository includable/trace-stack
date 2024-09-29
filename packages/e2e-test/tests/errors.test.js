import { invoke, truncate, getErrors } from "./utils";

describe("Errors", () => {
  beforeEach(truncate);

  it("should capture thrown errors", async () => {
    await invoke("main", "error-throw");

    const errors = await getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].error.type).toBe("Error");
  }, 15_000);

  it("should capture errors thrown loading handler", async () => {
    await invoke("error-loading");

    const errors = await getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].error.type).toBe("Error");
  }, 15_000);
});
