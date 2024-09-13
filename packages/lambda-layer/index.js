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

const verbose = process.env.TRACER_LOG_VERBOSE;

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
    if (verbose) {
      console.log("[tracer] Error loading user handler", e);
    }
    throw removeTracerFromStacktrace(e);
  }

  if (process.env.AUTO_TRACE_EXCLUDE) {
    if (verbose) {
      console.log("[tracer] AUTO_TRACE_EXCLUDE is set, skipping tracing");
    }
    return userHandler(event, context, callback);
  }

  if (verbose) {
    console.log("[tracer] Loaded user handler, starting logger");
  }

  await logger.start();

  let resultValue;
  try {
    resultValue = await tracer.trace(userHandler)(event, context, callback);
    if (verbose) {
      console.log("[tracer] User handler completed successfully");
    }
  } catch (e) {
    if (verbose) {
      console.log("[tracer] User handler threw an error");
    }
    await logger.flushQueue();
    throw removeTracerFromStacktrace(e);
  }

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
