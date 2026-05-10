import log from "loglevel";

(() => {
  log.setLevel("info");
})();

(() => {
  const originalWarn = console.warn;

  console.warn = (...args) => {
    const msg = args.join(" ");

    if (
      msg.includes("MapLibre") ||
      msg.includes("ParseStyle") ||
      msg.includes("source must have tiles") ||
      msg.includes("layer doesn't support this property")
    ) {
      return;
    }

    originalWarn(...args);
  };
})();
