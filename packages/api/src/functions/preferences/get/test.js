const { app } = require("./handler");

describe("preferences-get", () => {
  it("can get preferences if user exists and has preferences", async () => {
    const preferences = {
      myPreference: true,
      somethingElse: [123, "test", false, null],
    };
    const getHandler = jest.fn().mockResolvedValue({ Item: { preferences } });
    const dependencies = {
      User: {
        get: getHandler,
      },
      currentUser: {
        id: "test123",
      },
    };

    const result = await app({}, dependencies);

    expect(result).toEqual(preferences);
    expect(getHandler).toBeCalledTimes(1);
    expect(getHandler).toBeCalledWith({
      id: "test123",
    });
  });
  it("can get preferences if user exists and has no preferences", async () => {
    const getHandler = jest.fn().mockResolvedValue({ Item: {} });
    const dependencies = {
      User: {
        get: getHandler,
      },
      currentUser: {
        id: "test123",
      },
    };

    const result = await app({}, dependencies);

    expect(result).toEqual({});
    expect(getHandler).toBeCalledTimes(1);
    expect(getHandler).toBeCalledWith({
      id: "test123",
    });
  });
  it("can get preferences if user does not exist", async () => {
    const getHandler = jest.fn().mockResolvedValue({ Item: null });
    const dependencies = {
      User: {
        get: getHandler,
      },
      currentUser: {
        id: "test123",
      },
    };

    const result = await app({}, dependencies);

    expect(result).toEqual({});
    expect(getHandler).toBeCalledTimes(1);
    expect(getHandler).toBeCalledWith({
      id: "test123",
    });
  });
});
