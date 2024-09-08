let config;
try {
  config = require("./config.json");
} catch (e) {
  config = {
    token: "t_0000000000000000",
    edgeHost: process.env.AUTO_TRACE_HOST,
  };
}

const tracer = require("@lumigo/tracer")({
  token: config.token,
  edgeHost: process.env.AUTO_TRACE_HOST || config.edgeHost,
});

const { load } = require("./lib/aws/aws-user-function.js");

const initLogger = require("./lib/logger");
const logger = initLogger(config);

const getHandlerAsync = async () => {
  if (!process.env.TRACER_ORIGINAL_HANDLER) {
    throw new Error("Could not load the original handler.");
  }

  return load(
    process.env.LAMBDA_TASK_ROOT,
    process.env.TRACER_ORIGINAL_HANDLER,
  );
};

const removeTracerFromStacktrace = (err) => {
  // Note: this function was copied from utils.js. Keep them both up to date.
  try {
    if (!err || !err.stack) {
      return err;
    }
    const { stack } = err;
    const stackArr = stack.split("\n");

    const patterns = [
      "/dist/lumigo.js:",
      "auto_tracer_wrapper",
      "auto-instrument",
    ];
    const cleanedStack = stackArr.filter(
      (v) => !patterns.some((p) => v.includes(p)),
    );

    err.stack = cleanedStack.join("\n");

    console.error(err);
    return err;
  } catch (e) {
    console.error(err);
    return err;
  }
};

const handler = async (event, context, callback) => {
  let userHandler;
  try {
    userHandler = await getHandlerAsync();
  } catch (e) {
    throw removeTracerFromStacktrace(e);
  }

  if (process.env.AUTO_TRACE_EXCLUDE) {
    return userHandler(event, context, callback);
  }

  const resultValue = await tracer.trace(userHandler)(event, context, callback);
  await logger.flushQueue();
  return resultValue;
};

module.exports = { handler };

// pre-load our handler to speed up cold starts
try {
  (async () => {
    if (process.env.LAMBDA_TASK_ROOT) {
      await getHandlerAsync();
    }
  })();
} catch (e) {}
