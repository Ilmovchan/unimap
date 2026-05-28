import log from "loglevel";

(() => {
  log.setLevel("info");
})();

const isBenignMapLibreLog = (msg: string) =>
  msg.includes("MapLibre") ||
  msg.includes("ParseStyle") ||
  msg.includes("source must have tiles") ||
  msg.includes("layer doesn't support this property") ||
  msg.includes("Failed to obtain last location update") ||
  msg.includes("Mbgl-LocationComponent");

(() => {
  const originalWarn = console.warn;

  console.warn = (...args) => {
    const msg = args.join(" ");
    if (isBenignMapLibreLog(msg)) return;
    originalWarn(...args);
  };
})();

(() => {
  const originalError = console.error;

  console.error = (...args) => {
    const msg = args.join(" ");
    if (isBenignMapLibreLog(msg)) return;
    originalError(...args);
  };
})();
