#!/usr/bin/env node

const semver = require('semver');
const fs = require('fs');
const cp = require('child_process');
const readline = require('readline');
const { promisify } = require('util');
const { stripIndent } = require('common-tags');

const BASE_URL = 'https://julienw.github.io/forms-extension';
const NPM_PACKAGE = 'package.json';
const ADDON_MANIFEST = 'src/manifest.json';
const ADDON_SOURCES = 'src/';
const IGNORE_FILE = 'src/.packageIgnore';
const OUTPUT_DIR = 'docs';
const OUTPUT_FILENAME = version => `french_holiday_forms-${version}-fx.xpi`;
const OUTPUT_FILE = version => `${OUTPUT_DIR}/${OUTPUT_FILENAME(version)}`;
const PINNED_VERSIONS = {
  '1.3.3': {}, // could have a minGecko property
};
const UPDATE_FILENAME = 'updates.json';
const KNOWN_VERSION_MODES = [
  'major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease',
];

function readJSON(fileName) {
  var file_content = fs.readFileSync(fileName);
  var content = JSON.parse(file_content);

  return {
    get version() { return content.version; },
    set version(version) { content.version = version; },
    get addonId() { return content.applications.gecko.id; },
    get geckoMinVersion() { return content.applications.gecko.strict_min_version; },
    get updateUrl() { return content.applications.gecko.update_url; },
    write: function() {
      fs.writeFileSync(fileName, JSON.stringify(content, null, 2));
    }
  };
}

async function computeHashForFile(filename) {
  const crypto = require('crypto');
  const algorithm = 'sha512';

  const hash = await new Promise((resolve, reject) => {
    const hashCreator = crypto.createHash(algorithm);
    const input = fs.createReadStream(filename);
    input.on('readable', () => {
      const data = input.read();
      if (data)
        hashCreator.update(data);
      else {
        resolve(hashCreator.digest('hex'));
      }
    });
    input.on('error', error => reject(error));
  });

  return `${algorithm}:${hash}`;
}

async function updatesFile({ addonId, latestVersion, latestMinGecko }) {
  const updates = await Promise.all(Object.keys(PINNED_VERSIONS).map(async version => {
    const { minGecko } = PINNED_VERSIONS[version];

    const applications = {};
    if (minGecko) {
      applications.gecko = { strict_min_version: minGecko };
    }

    const hash = await computeHashForFile(OUTPUT_FILE(version));

    return {
      version,
      update_link: `${BASE_URL}/${OUTPUT_FILENAME(version)}`,
      update_hash: hash,
      applications,
    };
  }));

  const applications = {};
  if (latestMinGecko) {
    applications.gecko = { strict_min_version: latestMinGecko };
  }
  const hash = await computeHashForFile(OUTPUT_FILE(latestVersion));
  updates.push({
    version: latestVersion,
    update_link: `${BASE_URL}/${OUTPUT_FILENAME(latestVersion)}`,
    update_hash: hash,
    applications,
  });

  return {
    addons: {
      [addonId]: { updates }
    },
  };
}

function incrementRelease(version, mode) {
  return semver.inc(version, mode, 'pre');
}

function git(...args) {
  console.log('[git]', args.join(' '));
  return cp.execFileSync('git', args).toString();
}

function webext(...args) {
  console.log('[web-ext]', args.join(' '));
  var result = cp.execFileSync(
    '../node_modules/.bin/web-ext',
    args, { cwd: ADDON_SOURCES }
  ).toString();

  return result;
}

function findPackageFileName(buildOutput) {
  return buildOutput.match(/[^ ]+\.zip\b/)[0];
}

function findModeFromOptions(opts) {
  const modes = KNOWN_VERSION_MODES.filter(mode => mode in opts);
  if (modes.length > 1) {
    printHelp(`Only one mode must be specified. Requested modes: ${modes.join(', ')}`);
    process.exit(1);
  }
  return modes[0];
}

function getIgnorePatterns() {
  const stream = fs.createReadStream(IGNORE_FILE);
  const rl = readline.createInterface({
    input: stream
  });

  const result = [];
  return new Promise((resolve, reject) => {
    rl.on('line', line => {
      if (line) {
        result.push(line);
      }
    });
    rl.on('close', () => {
      resolve(result);
    });
    stream.on('error', e => {
      if (e.code === 'ENOENT') {
        console.log(`Found no ignore file '${IGNORE_FILE}', ignoring nothing.`);
        resolve([]);
      }
      reject(e);
    });
  });
}

// Web extensions do not support semver-like prerelease versions. Let's apply a
// slight conversion.
function semverToWebExtVersion(version) {
  return version.replace(/-(\w+)\.(\d+)$/, '$1$2');
}

function checkWorkspaceClean() {
  const status = git('status', '--porcelain');
  if (status.length) {
    throw new Error('Your workspace is not clean. Please commit or stash your changes.')
  }
}

async function pauseWithMessage(message) {
  if (message) {
    message += '\n';
  } else {
    message = '';
  }

  message += 'Press ENTER when youʼre ready...';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await promisify(rl.question).call(rl, message);
  rl.close();
}

var operations = {
  _readManifest() {
    if (this._manifest) {
      return;
    }

    this._manifest = readJSON(ADDON_MANIFEST);

    // Sanity checks
    const expectedUpdateUrl = `${BASE_URL}/${UPDATE_FILENAME}`;
    if (this._manifest.updateUrl !== expectedUpdateUrl) {
      throw new Error(`The update URL is '${this._manifest.updateUrl}' but we expected '${expectedUpdateUrl}'.`);
    }
  },

  async version(options) {
    console.log('>>> version <<<');
    checkWorkspaceClean();
    const mode = findModeFromOptions(options) || 'prerelease';
    var package = readJSON(NPM_PACKAGE);
    var newVersion = incrementRelease(package.version, mode);
    await pauseWithMessage(stripIndent`
      Incrementing ${package.version} to ${newVersion} (mode “${mode}”).
      If this isn't what you expect, press CTRL-C now.
    `);
    package.version = newVersion;
    package.write();
    console.log('Written to %s', NPM_PACKAGE);
    package = null;

    this._readManifest();
    this._manifest.version = semverToWebExtVersion(newVersion);
    this._manifest.write();
    console.log('Written to %s', ADDON_MANIFEST);

    await operations.deleteLatest();
    await operations.dist(options);
    await operations.sign(options);
    await operations.writeUpdates();
    await operations.copyLatest();
    console.log('Committing and tagging with git');
    console.log(git('add', '.'));
    console.log(git('commit', '-m', 'v' + newVersion));
    console.log(git('tag', newVersion));
  },

  async dist(options) {
    console.log('>>> dist <<<');
    console.log('Generating a new package...');

    const forceOverwrite = !!options.force;
    this._readManifest();

    const tmp = require('tmp');
    tmp.setGracefulCleanup();
    const tempDir = tmp.dirSync({ unsafeCleanup: true, prefix: 'forms-extension-build-' });
    const ignorePatterns = await getIgnorePatterns();
    const ignoreArguments = ignorePatterns.reduce((result, pattern) => [...result, '-i', pattern], []);
    const buildResult = webext('build', '--overwrite-dest', '-a', tempDir.name, ...ignoreArguments);
    var xpiName = findPackageFileName(buildResult);
    const outputFile = OUTPUT_FILE(this._manifest.version);
    if (fs.existsSync(outputFile) && !forceOverwrite) {
      console.error(`File '${outputFile}' already exists. Aborting...`);
      console.error(`Use '--force' to overwrite.`);
      process.exit(1);
    }
    console.log('Renaming %s to %s.', xpiName, outputFile);
    fs.renameSync(xpiName, outputFile);
  },

  async sign() {
    console.log('>>> sign <<<');
    this._readManifest();
    const outputFile = OUTPUT_FILE(this._manifest.version);
    await pauseWithMessage(stripIndent`
      Automatic signing isn't implemented yet.
      Please sign the newly generated file ${outputFile} using AMO's website
      and copy the result using the exact same name.
    `);
  },

  async writeUpdates() {
    console.log('>>> writeUpdates <<<');
    console.log('Generating a new update file...');
    this._readManifest();
    const content = await updatesFile({
      addonId: this._manifest.addonId,
      latestVersion: this._manifest.version,
      latestMinGecko: this._manifest.geckoMinVersion,
    });
    const updateFile = `${OUTPUT_DIR}/${UPDATE_FILENAME}`;
    console.log('Writing updates file', updateFile);
    fs.writeFileSync(updateFile, JSON.stringify(content, null, 2));
  },

  async help() { printHelp(); },

  deleteLatest() {
    console.log('>>> deleteLatest <<<');
    console.log('Deleting `latest` generic file...');
    const output = OUTPUT_FILE('latest');
    fs.unlinkSync(output);
  },

  copyLatest() {
    console.log('>>> copyLatest <<<');
    this._readManifest();
    const input = OUTPUT_FILE(this._manifest.version);
    const output = OUTPUT_FILE('latest');
    console.log(`Copying ${input} to ${output}...`);
    fs.copyFileSync(input, output);
  }
};

function printHelp(error) {
  if (error) {
    console.error(error);
  }
  console.log('Usage: %s <operation> <optional arguments>', process.argv[1]);
  console.log('<operation> can be `version`, `dist` or `help`.');
  console.log(
    'Operation `version` takes a semver increment type: %s. See https://github.com/npm/node-semver#functions for more information.',
    `--${KNOWN_VERSION_MODES.join(', --')}`
  );
  console.log('Operation `dist` takes an optional `--force` argument to allow overwriting the output files.');
}

const argv = require('minimist')(process.argv.slice(2));
if (argv._.length !== 1) {
  // More than 1 operation was specified on the command line
  printHelp();
  process.exit(1);
}

if (argv.help) {
  // --help was used somewhere
  printHelp();
  process.exit(0);
}

const operation = argv._[0];

if (! (operation in operations)) {
  // The specified operation is unknown
  printHelp(`Operation “${operation}” is unknown.`);
  process.exit(1);
}

operations[operation](argv).catch(
  e => {
    console.error(e);
    process.exit(1);
  }
);
