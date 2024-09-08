const { getTraceId } = require("@lumigo/tracer/dist/utils");
const fetch = require("node-fetch");

const uuid = require("../utils/uuid");

/**
 * Initialise log catcher and forwarder.
 * @param {Function} [externalLogger]
 */
const initLogger = (config = {}, externalLogger = undefined) => {
  let queue = [];
  let logSequenceNumber = 0;

  const flushQueue = async () => {
    if (!queue.length) return;

    const queueToSend = [...queue];
    queue = [];

    try {
      await fetch(`https://${process.env.AUTO_TRACE_HOST}/api/spans`, {
        method: "POST",
        body: JSON.stringify(queueToSend),
        headers: {
          "Content-Type": "application/json",
          Authorization: config.token,
        },
      });
    } catch (e) {
      global.console._originalConsoleError(
        `[Tracer] Failed sending log to remote server: ${e.message}`,
      );
      queue = queue.concat(queueToSend);
    }
  };

  const needsFlush = () => {
    return queue.length > 50;
  };

  const remoteLogger = (type, args) => {
    if (externalLogger) {
      return externalLogger(type, args);
    }

    try {
      const trace = getTraceId(process.env._X_AMZN_TRACE_ID);
      logSequenceNumber++;
      if (logSequenceNumber > 10000) {
        logSequenceNumber = 0;
      }

      queue.push({
        id: uuid(),
        info: {
          traceId: trace,
          tracer: {
            name: "@trace-stack/logger",
            version: "1.0.0",
          },
        },
        token: config.token,
        transactionId: trace.transactionId,
        type: "log",
        logType: type,
        log: JSON.stringify(args),
        logSequenceNumber: logSequenceNumber,
        started: Number(`${Date.now()}.${logSequenceNumber}`),
      });

      if (needsFlush()) {
        flushQueue();
      }
    } catch (e) {
      global.console._originalConsoleError(
        `[Tracer] Failed capturing log: ${e.message}`,
      );
    }
  };

  const stop = () => {
    global.console = global.console._originalConsole;
  };

  global.console = (function (console) {
    return {
      _originalConsole: console,
      _originalConsoleError: (error) => console.error.apply(console, [error]),
      log: function () {
        console.log.apply(console, arguments);
        remoteLogger("log", arguments);
      },
      warn: function () {
        console.warn.apply(console, arguments);
        remoteLogger("warn", arguments);
      },
      error: function () {
        console.error.apply(console, arguments);
        remoteLogger("error", arguments);
      },
      info: function () {
        console.info.apply(console, arguments);
        remoteLogger("info", arguments);
      },
    };
  })(console);

  return { flushQueue, stop, queue };
};

module.exports = initLogger;
