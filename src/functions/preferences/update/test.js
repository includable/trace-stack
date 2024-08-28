const { app } = require("./handler");

describe("preferences-update", () => {
  it("can update if user exists", async () => {
    const event = {
      body: {
        myPreference: true,
        somethingElse: [123, "test", false, null],
      },
    };
    const updateHandler = jest
      .fn()
      .mockResolvedValue({ Attributes: { preferences: event.body } });
    const dependencies = {
      User: {
        update: updateHandler,
      },
      currentUser: {
        id: "test123",
      },
    };

    const result = await app(event, dependencies);

    expect(result).toEqual(event.body);
    expect(updateHandler).toBeCalledTimes(1);
    expect(updateHandler).toBeCalledWith(
      {
        id: "test123",
        preferences: { $set: event.body },
      },
      {
        returnValues: "all_new",
      }
    );
  });
  it("can update if user does not exist", async () => {
    const event = {
      body: {
        myPreference: true,
        somethingElse: [123, "test", false, null],
      },
    };
    const updateHandler = jest
      .fn()
      .mockRejectedValueOnce(new Error("Item not found."))
      .mockResolvedValue({ Attributes: { preferences: event.body } });
    const dependencies = {
      User: {
        update: updateHandler,
      },
      currentUser: {
        id: "test123",
      },
    };

    const result = await app(event, dependencies);

    expect(result).toEqual(event.body);
    expect(updateHandler).toBeCalledTimes(2);
    expect(updateHandler).toBeCalledWith(
      {
        id: "test123",
        preferences: { $set: event.body },
      },
      {
        returnValues: "all_new",
      }
    );
    expect(updateHandler).toBeCalledWith(
      {
        id: "test123",
        preferences: event.body,
      },
      {
        returnValues: "all_new",
      }
    );
  });
  it("rejects invalid body", async () => {
    const event = {
      body: "lalala",
    };
    const dependencies = {
      User: {
        update: jest.fn(),
      },
      currentUser: {
        id: "test123",
      },
    };

    expect.assertions(2);

    try {
      await app(event, dependencies);
    } catch (e) {
      expect(e.message).toEqual('"value" must be of type object');
    }

    expect(dependencies.User.update).not.toBeCalled();
  });
});
