const { execSync } = require("child_process");
const path = require("path");
const assert = require("assert");
const assertPackageManager = require("./assert-package-manager");

function testCli(execPath, args = "") {
  return execSync(
    `node ${path.resolve(__dirname, "./bin/assert-package-manager")} ${args}`,
    {
      stdio: "pipe",
      env: {
        ...process.env,
        npm_execpath: execPath,
      },
      encoding: "utf8",
    }
  );
}

let numTests = 0;
let numFailures = 0;
const allFailed = {};

function testExecPaths(execPaths, tests) {
  execPaths.forEach((execPath) => {
    assertPackageManager.EXEC_PATH = execPath;
    const condition = `when $npm_execpath === "${execPath}":`;
    const failures = allFailed[condition] || (allFailed[condition] = []);
    console.log(condition);
    Object.entries(tests).forEach(([name, cb]) => {
      numTests++;
      const desc = `${numTests}) ${name}`;
      process.stdout.write(`  ${desc}...`);
      try {
        cb(desc, execPath);
        process.stdout.write("OK!\n");
      } catch (error) {
        numFailures++;
        failures.push({ desc, error });
        process.stdout.write("FAILED!\n");
        console.error(`  - ${error.message}`);
      }
    });
  });
}

testExecPaths(["/path/to/npm", "/path/to/node_modules/.somewhere/npm-cli.js"], {
  "detected package manager is npm": (desc) => {
    assert.equal(assertPackageManager.detect(), "npm", desc);
  },
  "accepts one string arg": (desc) => {
    assert.doesNotThrow(() => assertPackageManager("npm"), desc);
  },
  "accepts 1-length array": (desc) => {
    assert.doesNotThrow(() => assertPackageManager(["npm"]), desc);
  },
  "accepts array of clients and paths": (desc) => {
    assert.doesNotThrow(
      () => assertPackageManager(["npm", "yarn", "/something/else"]),
      desc
    );
  },
  "accepts multiple args of clients and paths": (desc) => {
    assert.doesNotThrow(
      () => assertPackageManager("npm", "yarn", "/something/else"),
      desc
    );
  },
  'assertPackageManager("yarn") throws': (desc) => {
    assert.throws(
      () => assertPackageManager("yarn"),
      /can only be used with the "yarn" package manager, but it was invoked by "npm"/,
      desc
    );
  },
  'assertPackageManager(["yarn","pnpm"]) throws with good grammar': (desc) => {
    assert.throws(
      () => assertPackageManager("yarn", "pnpm"),
      /can only be used with the "yarn" or "pnpm" package managers, but it was invoked by "npm"/,
      desc
    );
  },
  'cli "assert-package-manager" returns npm': (desc, execPath) => {
    assert.equal(testCli(execPath).trim(), "npm", desc);
  },
  'cli "assert-package-manager npm" exits clean': (desc, execPath) => {
    assert.doesNotThrow(() => testCli(execPath, "npm"), desc);
  },
  'cli "assert-package-manager yarn pnpm npm" exits clean': (
    desc,
    execPath
  ) => {
    assert.doesNotThrow(() => testCli(execPath, "yarn pnpm npm"), desc);
  },
  'cli "assert-package-manager yarn pnpm" errors out': (desc, execPath) => {
    assert.throws(
      () => testCli(execPath, "yarn pnpm"),
      /can only be used with the "yarn" or "pnpm" package managers, but it was invoked by "npm"/,
      desc
    );
  },
});

testExecPaths(["/Users/you/.yarn/bin/yarn", "/path/to/yarn.js"], {
  "detected package manager is yarn": (desc) => {
    assert.equal(assertPackageManager.detect(), "yarn", desc);
  },
  'assertPackageManager("yarn") is true': (desc) => {
    assert.doesNotThrow(() => assertPackageManager("yarn"), desc);
  },
  'assertPackageManager(["npm", "yarn", "/something/else"]) is true': (
    desc
  ) => {
    assert.doesNotThrow(
      () => assertPackageManager(["npm", "yarn", "/something/else"]),
      desc
    );
  },
  'assertPackageManager("npm") throws': (desc) => {
    assert.throws(
      () => assertPackageManager("npm"),
      /can only be used with the "npm" package manager, but it was invoked by "yarn"/,
      desc
    );
  },
  'assertPackageManager(["npm","pnpm"]) throws with good grammar': (desc) => {
    assert.throws(
      () => assertPackageManager("npm", "pnpm"),
      /can only be used with the "npm" or "pnpm" package managers, but it was invoked by "yarn"/,
      desc
    );
  },
  'cli "assert-package-manager" returns yarn': (desc, execPath) => {
    assert.equal(testCli(execPath).trim(), "yarn", desc);
  },
  'cli "assert-package-manager yarn" exits clean': (desc, execPath) => {
    assert.doesNotThrow(() => testCli(execPath, "yarn"), desc);
  },
  'cli "assert-package-manager yarn pnpm npm" exits clean': (
    desc,
    execPath
  ) => {
    assert.doesNotThrow(() => testCli(execPath, "yarn pnpm npm"), desc);
  },
  'cli "assert-package-manager npm" errors out': (desc, execPath) => {
    assert.throws(
      () => testCli(execPath, "npm"),
      /can only be used with the "npm" package manager, but it was invoked by "yarn"/,
      desc
    );
  },
});

testExecPaths(["/path/to/pnpm"], {
  "detects a package manager with no known filename aliases by path": (
    desc,
    execPath
  ) => {
    assert.equal(assertPackageManager.detect(), execPath, desc);
  },
  "asserts on an unknown package manager": (desc, execPath) => {
    assert.doesNotThrow(() => assertPackageManager(execPath, "yarn"), desc);
  },
  "throws if unknown package manager is not matched": (desc, execPath) => {
    assert.throws(
      () => assertPackageManager("yarn", "npm"),
      new RegExp(
        `can only be used with the "yarn" or "npm" package managers, but it was invoked by "${execPath}"`
      ),
      desc
    );
  },
  'cli "assert-package-manager" returns full path': (desc, execPath) => {
    assert.equal(testCli(execPath).trim(), execPath);
  },
  'cli "assert-package-manager ${execPath}" exits clean': (desc, execPath) => {
    assert.doesNotThrow(() => testCli(execPath, execPath), desc);
  },
  'cli "assert-package-manager yarn ${execPath} npm" exits clean': (
    desc,
    execPath
  ) => {
    assert.doesNotThrow(() => testCli(execPath, `yarn ${execPath} npm`), desc);
  },
  'cli "assert-package-manager npm" errors out': (desc, execPath) => {
    assert.throws(
      () => testCli(execPath, "npm"),
      new RegExp(
        `can only be used with the "npm" package manager, but it was invoked by "${execPath}"`
      ),
      desc
    );
  },
});

testExecPaths([""], {
  "detects no package manager": (desc) => {
    assert.equal(assertPackageManager.detect(), "", desc);
  },
  "asserts no package manager": (desc) => {
    assert.throws(
      () => assertPackageManager(["npm", "yarn", "pnpm"]),
      /it was invoked by "node" directly, which is not supported/,
      desc
    );
  },
  "cli returns nothing": (desc) => {
    assert.equal(testCli("").trim(), "", desc);
  },
  "cli throws if any package manager is named": (desc) => {
    assert.throws(
      () => testCli("", "npm yarn pnpm /anything/anywhere.js"),
      /it was invoked by "node" directly, which is not supported/,
      desc
    );
  },
});

const failed = numFailures > 0;

if (failed) {
  console.log(`${numFailures} tests failed.`);
  Object.entries(allFailed).forEach(([condition, failures]) => {
    if (failures.length > 0) {
      console.log(`Test failures ${condition}`);
      failures.forEach(({ desc, error }) => {
        console.error(desc, error);
      });
    }
  });
}

console.log(
  `\n  -- ${numTests - numFailures} of ${numTests} tests passed. --\n`
);

process.exit(failed ? 1 : 0);
