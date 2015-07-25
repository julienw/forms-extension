#!/usr/bin/env node

var semver = require('semver');
var fs = require('fs');

var NPM_PACKAGE = 'package.json';
var ADDON_PACKAGE = 'src/package.json';

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
  },
  dist: function() {
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
  printHelp('Operation ' + operation.operation + ' not found.');
  process.exit(1);
  return;
}

operations[operation.operation](operation.argument);
