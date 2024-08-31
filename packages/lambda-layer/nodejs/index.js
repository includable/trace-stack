const tracer = require("@lumigo/tracer")({
  token: "t_0000000000000000",
  edgeHost: process.env.AUTO_TRACE_HOST,
});
const { load } = require("./aws/aws-user-function.js");
const initLogger = require("./logger.js");

const ORIGINAL_HANDLER_KEY = "TRACER_ORIGINAL_HANDLER";

const getHandlerAsync = async () => {
  if (process.env[ORIGINAL_HANDLER_KEY] === undefined)
    throw Error("Could not load the original handler.");
  return load(process.env.LAMBDA_TASK_ROOT, process.env[ORIGINAL_HANDLER_KEY]);
};

const removeTracerFromStacktrace = (err) => {
  // Note: this function was copied from utils.js. Keep them both up to date.
  try {
    if (!err || !err.stack) {
      return err;
    }
    const { stack } = err;
    const stackArr = stack.split("\n");

    const patterns = ["/dist/lumigo.js:", "auto-instrument"];
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

  initLogger();
  return tracer.trace(userHandler)(event, context, callback);
};

module.exports = { ORIGINAL_HANDLER_KEY, handler: handler };
try {
  (async () => {
    await getHandlerAsync();
  })();
} catch (e) {}
