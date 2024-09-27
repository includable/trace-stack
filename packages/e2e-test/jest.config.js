const config = {
  globalSetup: import.meta.resolve("./jest.setup.js").replace("file://", ""),
};

export default config;
