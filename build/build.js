#!/usr/bin/env node

var semver = require('semver');
var fs = require('fs');
var cp = require('child_process');

var NPM_PACKAGE = 'package.json';
var ADDON_PACKAGE = 'src/package.json';
var ADDON_SOURCES = 'src/';
var OUTPUT_XPI = 'dist/forms-extension-latest.xpi';

function readPackage(fileName) {
  var file_content = fs.readFileSync(fileName);
  var content = JSON.parse(file_content);

  return {
    get version() { return content.version; },
    set version(version) { content.version = version; },
    write: function() {
      fs.writeFileSync(fileName, JSON.stringify(content, null, 2));
    }
  };
}

function incrementRelease(version, mode) {
  return semver.inc(version, mode, 'pre');
}

function git(...args) {
  console.log('[git]', args.join(' '));
  cp.execFileSync('git', args, { stdio: 'inherit' });
}

function jpm(...args) {
  console.log('[jpm]', args.join(' '));
  var result = cp.execFileSync(
    '../node_modules/.bin/jpm',
    args, { cwd: ADDON_SOURCES }
  ).toString();

  return result;
}

function findXpiName(jpmOutput) {
  return jpmOutput.match(/[^ ]+\.xpi\b/)[0];
}

var operations = {
  version: function(mode) {
    mode = mode || 'prerelease';
    var package = readPackage(NPM_PACKAGE);
    var newVersion = incrementRelease(package.version, mode);
    console.log('Incrementing %s to %s (mode %s)', package.version, newVersion, mode);
    package.version = newVersion;
    package.write();
    console.log('Written to %s', NPM_PACKAGE);
    package = null;

    var addonPackage = readPackage(ADDON_PACKAGE);
    addonPackage.version = newVersion;
    addonPackage.write();
    console.log('Written to %s', ADDON_PACKAGE);
    addonPackage = null;
    console.log('Generating a new XPI...');
    operations.dist();
    console.log('Committing and tagging with git');
    git('add', ADDON_PACKAGE, NPM_PACKAGE, OUTPUT_XPI);
    git('commit', '-m', 'v' + newVersion);
    git('tag', newVersion);
  },
  dist: function() {
    var xpiResult = jpm('xpi');
    var xpiName = findXpiName(xpiResult);
    console.log('Renaming %s to %s.', xpiName, OUTPUT_XPI);
    fs.rename(xpiName, OUTPUT_XPI);
  },
  sign: function() {
    const signResult = jpm('sign', '');
  },
  help: function() { printHelp(); }
};

function getOperation(argv) {
  return {
    operation: argv[2],
    argument: argv[3]
  };
}

function printHelp(error) {
  if (error) {
    console.error(error);
  }
  console.log('Usage: %s <operation> <arg>', process.argv[1]);
  console.log('<operation> can be `version`, `dist` or `help`.');
  console.log('Operation `version` takes a semver increment type: major, premajor, minor, preminor, patch, prepatch, or prerelease. See https://github.com/npm/node-semver#functions for more information.');
  console.log('Operation `dist` takes no argument.');
}

var operation = getOperation(process.argv);
if (! (operation.operation in operations)) {
  printHelp(`Operation '${operation.operation}' not found.`);
  process.exit(1);
  return;
}

operations[operation.operation](operation.argument);
