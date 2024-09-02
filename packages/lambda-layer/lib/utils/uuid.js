// We use an alternative UUID implementation to prevent bundling issues.
// This one is less secure, but randomness is less of an issue for log IDs.

const str = () =>
  (
    "00000000000000000" + (Math.random() * 0xffffffffffffffff).toString(16)
  ).slice(-16);

const uuid = () => {
  const a = str();
  const b = str();
  return (
    a.slice(0, 8) +
    "-" +
    a.slice(8, 12) +
    "-4" +
    a.slice(13) +
    "-a" +
    b.slice(1, 4) +
    "-" +
    b.slice(4)
  );
};

module.exports = uuid;
