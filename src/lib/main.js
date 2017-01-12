/*jshint esnext:true */

var XMLHttpRequest = require('sdk/net/xhr').XMLHttpRequest;
var ActionButton = require('sdk/ui/button/action').ActionButton;
var tabs = require('sdk/tabs');

var ptoWebsiteUrl = 'https://pto.mozilla.org/mypto.php';

function init() {
  ActionButton({
    id: 'forms-extension',
    label: 'generate forms',
    icon: './icon-opt.svg',
    onClick: generate
  });
}

function generate() {
  getAllHolidays(ptoWebsiteUrl).then(showResults);
}

/**
 * Retrieve a document at this url, handling authentication in the process.
 *
 * @returns {Promise.<Document>}
 */
function getDocumentAtUrl(url) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'document';
    xhr.withCredentials = true;
    xhr.onload = function() {
      if (isAuthenticationNeeded(xhr)) {
        resolve(authenticate(url).then(() => getDocumentAtUrl(url)));
        return;
      }

      resolve(xhr.responseXML);
    };

    xhr.onerror = () => reject(new Error('Network Error'));

    xhr.send();
  });
}

function isAuthenticationNeeded(xhr) {
  return (xhr.status === 401);
}

/**
 * Retrieve the mypto page and parses it to a JS object
 *
 * @returns {Promise.<Array.<{start, end, comment}>>}
 */
function getAllHolidays(url) {
  return getDocumentAtUrl(url).then(document => {
    var lines = document.querySelectorAll('tbody > tr');
    var holidays = Array.from(lines).map((line) => {
      var txtHours = parseInt(line.children[1].textContent, 10);
      var txtStartDate = line.children[2].textContent;
      var txtEndDate = line.children[3].textContent;
      var txtComment = line.children[4].textContent;

      var startDate = new Date(txtStartDate + ' UTC');
      var endDate = new Date(txtEndDate + ' UTC');

      return { start: startDate, end: endDate, comment: txtComment, hours: txtHours };
    });

    return holidays;
  }).catch(e => {
    console.error('got error while retrieving document:', e);
    throw e;
  });
}

/**
 * Opens a pto.mozilla.org page in a tab to trigger authentication.
 *
 * @returns Promise
 */
function authenticate(url) {
  return new Promise((resolve, reject) => {
    tabs.open({
      url,
      inBackground: true,
      onReady: function(tab) {
        if (tab.title.startsWith('401')) {
          reject(new Error('User canceled authentication'));
        } else {
          resolve();
        }
        tab.close();
      }
    });
  });
}

function showResults(holidays) {
  tabs.open({
    url: './results.html',
    onLoad: function(tab) {
      var worker = tab.attach({
        contentScriptFile: ['./communication.js']
      });
      worker.port.emit('show', holidays);
    }
  });
}

init();

