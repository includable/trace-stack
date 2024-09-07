class Logger {
  constructor(prefix) {
    this.prefix = `[${prefix}]`;
  }

  info(...message) {
    console.log(this.prefix, ...message);
  }

  error(...message) {
    console.error(this.prefix, ...message);
  }

  warn(...message) {
    console.warn(this.prefix, ...message);
  }
}

export default Logger;
