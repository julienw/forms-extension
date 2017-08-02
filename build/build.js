#!/usr/bin/env node

var semver = require('semver');
var fs = require('fs');
var cp = require('child_process');

const NPM_PACKAGE = 'package.json';
const ADDON_MANIFEST = 'src/manifest.json';
const ADDON_SOURCES = 'src/';
const OUTPUT_DIR = 'docs';
const OUTPUT_FILE = version => `${OUTPUT_DIR}/french_holiday_forms-${version}-fx.xpi`;
const PINNED_VERSIONS = {
  '1.3.3': {}, // could have a minGecko property
};
const UPDATE_FILE = 'updates.json';
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
  const updates = await Object.keys(PINNED_VERSIONS).map(async version => {
    const { minGecko } = PINNED_VERSIONS[version];

    const applications = {};
    if (minGecko) {
      applications.gecko = { strict_min_version: minGecko };
    }

    const hash = await computeHashForFile(OUTPUT_FILE(version));

    return {
      version,
      update_link: 'XXX',
      update_hash: hash,
      applications,
    };
  });

  const applications = {};
  if (latestMinGecko) {
    applications.gecko = { strict_min_version: latestMinGecko };
  }
  const hash = await computeHashForFile(OUTPUT_FILE(latestVersion));
  updates.push({
    version: latestVersion,
    update_link: 'XXX',
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

function git() {
  var args = [].slice.call(arguments);
  console.log('[git]', args.join(' '));
  cp.execFileSync('git', args, { stdio: 'inherit' });
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

var operations = {
  _readManifest() {
    if (this._manifest) {
      return;
    }

    this._manifest = readJSON(ADDON_MANIFEST);
  },

  async version(options) {
    const mode = findModeFromOptions(options) || 'prerelease';
    var package = readJSON(NPM_PACKAGE);
    var newVersion = incrementRelease(package.version, mode);
    console.log('Incrementing %s to %s (mode %s)', package.version, newVersion, mode);
    package.version = newVersion;
    package.write();
    console.log('Written to %s', NPM_PACKAGE);
    package = null;

    this._readManifest();
    this._manifest.version = newVersion;
    this._manifest.write();
    console.log('Written to %s', ADDON_MANIFEST);

    console.log('Generating a new package...');
    await operations.dist(options);
    console.log('Signing...');
    await operations.sign(options);
    console.log('Generating a new update file...');
    await operations.writeUpdates();
    console.log('Committing and tagging with git');
    git('add', '.');
    git('commit', '-m', 'v' + newVersion);
    git('tag', newVersion);
  },
  async dist(options) {
    const forceOverwrite = !!options.force;
    this._readManifest();

    const tmp = require('tmp');
    tmp.setGracefulCleanup();
    const tempDir = tmp.dirSync({ unsafeCleanup: true, prefix: 'forms-extension-build-' });
    var buildResult = webext('build', '--overwrite-dest', '-a', tempDir.name);
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

  },
  async writeUpdates() {
    this._readManifest();
    const content = await updatesFile({
      addonId: this._manifest.addonId,
      latestVersion: this._manifest.version,
      latestMinGecko: this._manifest.geckoMinVersion,
    });
    console.log('Writing updates file', UPDATE_FILE);
    fs.writeFileSync(UPDATE_FILE, JSON.stringify(content, null, 2));
  },
  async help() { printHelp(); }
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
  printHelp();
  process.exit(1);
}
const operation = argv._.pop();

if (! (operation in operations)) {
  printHelp('Operation ' + operation + ' not found.');
  process.exit(1);
}

operations[operation](argv).catch(
  e => {
    console.error(e);
    process.exit(1);
  }
);
