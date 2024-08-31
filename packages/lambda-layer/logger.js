const { getTraceId } = require("@lumigo/tracer/dist/utils");
const { default: axios } = require("axios");

/**
 * Initialise log catcher and forwarder.
 * @param {Function} [externalLogger]
 */
const initLogger = (externalLogger = undefined) => {
  const remoteLogger = (type, args) => {
    if (externalLogger) {
      return externalLogger(type, args);
    }
    try {
      const trace = getTraceId(process.env._X_AMZN_TRACE_ID);
      return axios.post(
        `https://${process.env.AUTO_TRACE_HOST}/api/spans`,
        [
          {
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
          },
        ],
        {
          headers: {
            Authorization: "t_0000000000000000",
          },
        },
      );
    } catch (e) {
      global.console._originalConsoleError(
        `Failed sending log to remote server: ${e.message}`,
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
};

module.exports = initLogger;
