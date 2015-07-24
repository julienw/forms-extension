/*jshint esnext:true */

var XMLHttpRequest = require('sdk/net/xhr').XMLHttpRequest;
var ActionButton = require('sdk/ui/button/action').ActionButton;
var tabs = require('sdk/tabs');
var data = require('sdk/self').data;

var ptoWebsiteUrl = 'https://pto.mozilla.org/mypto.php';

function init() {
  ActionButton({
    id: 'forms-extension',
    label: 'generate forms',
    icon: {
      16: "./icon-16.png",
      32: "./icon-32.png",
      48: "./icon-48.png"
    },
    onClick: generate
  });
}

function generate() {
  var periodStart;

  var what = 'lastmonth';
  switch (what) {
    case 'lastmonth':
      var currentDate = new Date();
      periodStart = new Date(Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth() - 1,
        1
      ));
  }

  var periodEnd = new Date(Date.UTC(
    periodStart.getUTCFullYear(),
    periodStart.getUTCMonth() + 1,
    0
  ));

  getAllHolidays(ptoWebsiteUrl).then(
    holidays => holidays.map(findWeeksForHoliday)
  ).then(showResults);
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
      var txtStartDate = line.children[2].textContent;
      var txtEndDate = line.children[3].textContent;
      var txtComment = line.children[4].textContent;

      var startDate = new Date(txtStartDate + ' UTC');
      var endDate = new Date(txtEndDate + ' UTC');

      return { start: startDate, end: endDate, comment: txtComment };
    });

    return holidays;
  }).catch(e => console.error('got error while retrieving document:', e));
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

function findWeeksForHoliday(holiday) {
  var start = holiday.start;
  var end = holiday.end;

  var weeks = [];
  var curDate = start;
  while (end >= getWeekStart(curDate)) {
    var week = getWorkingWeek(curDate);

    if (start > week.end || end < week.start) {
      // if start or end is outside a working week
      curDate = nextWeek(curDate);
      continue;
    }

    week.holidayStart = week.start;
    week.holidayEnd = week.end;

    if (start >= week.start) {
      // the holiday start is in this week
      week.holidayStart = start;
    }

    if (end <= week.end) {
      // the holiday end is in this week
      week.holidayEnd = end;
    }

    week.type = findHolidayType(holiday.comment);
    weeks.push(week);
    curDate = nextWeek(curDate);
  }

  return weeks;
}

var KNOWN_TYPES = ['R', 'CP', 'JF', 'A', 'CSS', 'M'];
function findHolidayType(comment) {
  return KNOWN_TYPES.find(type => comment && comment.startsWith(type + '.'));
}

function getWorkingWeek(date) {
  var weekStart = new Date(+date);
  var sundayDate = weekStart.getUTCDate() - weekStart.getUTCDay();
  // monday
  weekStart.setUTCDate(sundayDate + 1);

  var weekEnd = new Date(+date);
  // friday
  weekEnd.setUTCDate(sundayDate + 5);

  return {
    start: weekStart,
    end: weekEnd
  };
}

function getWeekStart(date) {
  var weekStart = new Date(+date);
  var sundayDate = weekStart.getUTCDate() - weekStart.getUTCDay();
  weekStart.setUTCDate(sundayDate);
  return weekStart;
}

function nextWeek(date) {
  var oneWeek = 7 * 24 * 60 * 60 * 1000;
  var nextWeekDate = new Date(+date + oneWeek);
  return nextWeekDate;
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

