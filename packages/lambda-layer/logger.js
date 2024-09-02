const { getTraceId } = require("@lumigo/tracer/dist/utils");
const { default: axios } = require("axios");
const { v4: uuid } = require("uuid");

/**
 * Initialise log catcher and forwarder.
 * @param {Function} [externalLogger]
 */
const initLogger = (externalLogger = undefined) => {
  let queue = [];

  const flushQueue = async () => {
    if (!queue.length) return;

    const queueToSend = [...queue];
    queue = [];

    try {
      await axios.post(
        `https://${process.env.AUTO_TRACE_HOST}/api/spans`,
        queueToSend,
        {
          headers: {
            Authorization: "t_0000000000000000",
          },
        },
      );
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

      queue.push({
        id: uuid(),
        info: {
          traceId: trace,
          tracer: {
            name: "auto-tracer#logger",
            version: "1.0.0",
          },
        },
        transactionId: trace.transactionId,
        type: "log",
        logType: type,
        log: JSON.stringify(args),
        started: Date.now(),
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

  global.console = (function (console) {
    return {
      _originalConsoleError: (error) => console.error.apply(console, error),
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

  return { flushQueue };
};

module.exports = initLogger;
