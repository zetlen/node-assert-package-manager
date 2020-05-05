class WrongPackageManagerError extends Error {
  constructor(allowedPackageManagers, invoked) {
    const invokedBy = invoked ? `"${invoked}"` : '"node" directly';
    const names = allowedPackageManagers.map((name) => `"${name}"`);
    let allowed;
    if (names.length === 1) {
      allowed = `${names[0]} package manager`;
    } else {
      const last = names[names.length - 1];
      const first = names.slice(0, names.length - 1);
      allowed = `${first.join(", ")} or ${last} package managers`;
    }
    super(
      `This project can only be used with the ${allowed}, but it was invoked by ${invokedBy}, which is not supported.`
    );
    this.info = {
      allowedPackageManagers,
      invokedPackageManager: invoked,
    };
  }
}

const byFilename = {
  yarn: "yarn",
  "yarn.js": "yarn",
  npm: "npm",
  "npm-cli.js": "npm",
};

function detectCurrentPackageManager() {
  const execPath = assertPackageManager.EXEC_PATH;
  if (!execPath) {
    // no package manager is running!
    return "";
  }
  const executing = require("path").basename(execPath);
  const known = byFilename.hasOwnProperty(executing) && byFilename[executing];
  return known || execPath;
}

function assertPackageManager(...expected) {
  // flatten so we can accept arrays and multiple args
  const allowed = [].concat(...expected);
  const invoked = assertPackageManager.detect();
  const invalid = allowed.filter(
    (name) => typeof name !== "string" || name === ""
  );
  if (invalid.length > 0) {
    throw new Error(
      `Invalid values passed to assertPackageManager: ${invalid}`
    );
  }
  if (!allowed.includes(invoked)) {
    throw new WrongPackageManagerError(allowed, invoked);
  }
  return true;
}

assertPackageManager.EXEC_PATH = process.env.npm_execpath;
assertPackageManager.detect = detectCurrentPackageManager;

module.exports = assertPackageManager;
