const { app } = require("./handler");

describe("media-upload", () => {
  it("can generate signed URL", async () => {
    const event = {
      query: {
        type: "custom-image",
      },
    };
    const getSignedUrl = jest.fn().mockReturnValue("https://example.com/");
    const dependencies = {
      getSignedUrl,
      uuid: jest.fn().mockReturnValue("133a1a65-dc63-48e5-9afd-40d17b228874"),
      currentUser: {
        id: "test123",
      },
    };

    process.env.CLOUDFRONT_DOMAIN = "test.com";
    const result = await app(event, dependencies);

    expect(result).toEqual({
      publicUrl:
        "https://test.com/custom-image/test123/133a1a65-dc63-48e5-9afd-40d17b228874/image.jpg",
      uploadUrl: "https://example.com/",
    });
    expect(getSignedUrl).toBeCalledTimes(1);
    expect(getSignedUrl).toBeCalledWith(
      "custom-image/test123/133a1a65-dc63-48e5-9afd-40d17b228874/image.jpg",
      "image/jpeg",
      {
        "x-upload-user": "test123",
        "x-upload-category": "custom-image",
        "x-upload-filename": "image.jpg",
      }
    );
  });
});
