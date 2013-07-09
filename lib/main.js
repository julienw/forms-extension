var XMLHttpRequest = require('sdk/net/xhr').XMLHttpRequest;
var Widget = require('sdk/widget').Widget;
var tabs = require('sdk/tabs');
var data = require('sdk/self').data;

var urlTemplate = 'https://intranet.mozilla.org/pto/export.php?format=json&' +
  'start_date_from=${startDateFrom}&start_date_to=${startDateTo}&' +
  'first_name=${firstName}&end_date_from=${endDateFrom}&' +
  'end_date_to=${endDateTo}&last_name=${lastName}&pto_table_length=100';

var ptoWebsiteUrl = 'http://pto.mozilla.org/';

function init() {
  Widget({
    id: 'forms-extension',
    label: 'generate forms',
    content: 'generate',
    width: 50,
    onClick: generate
  });
}

function generate() {

  var periodStart;

  var what = 'lastmonth';
  switch (what) {
    case 'lastmonth':
      var currentDate = new Date();
      periodStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1);
  }

  var periodEnd = new Date(
    periodStart.getFullYear(),
    periodStart.getMonth() + 1,
    0);

  var firstName = 'Julien';
  var lastName = 'Wajsberg';

  var url1 = interpolate(urlTemplate, {
    firstName: firstName,
    lastName: lastName,
    startDateFrom: toUSDate(periodStart),
    startDateTo: toUSDate(periodEnd)
  });

  var url2 = interpolate(urlTemplate, {
    firstName: firstName,
    lastName: lastName,
    endDateFrom: toUSDate(periodStart),
    endDateTo: toUSDate(periodEnd)
  });

  getJSON(url1, onGetJSON);
  getJSON(url2, onGetJSON);

  var parallelGet = 2;
  var results = [];
  var ignoreFutureResults = false;

  function onGetJSON(e) {
    if (ignoreFutureResults) {
      return;
    }

    if (e.target.status == 401) {
      ignoreFutureResults = true;
      xhrerror(e);
      return;
    }

    results.push(e.target.response);
    if (--parallelGet === 0) {
      handleResult(results);
    }
  }
}

function getJSON(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('get', url, true);
  xhr.withCredentials = true;
  xhr.onload = callback;
  xhr.onerror = xhrerror;
  xhr.responseType = 'json';
  xhr.send();
}

function xhrerror(e) {
  if (e.target.status == 401) {
    tabs.open({
      url: ptoWebsiteUrl,
      inBackground: true,
      onReady: function(tab) {
        tab.close();
        generate();
      }
    });
  }
}

function handleResult(results) {
  var parsedResults = {};
  results.forEach(function(result) {
    var holidays = result.aaData;
    holidays.forEach(function(holiday) {
      var id = holiday[1];
      var objectifiedHoliday = {
        id: id,
        start: new Date(holiday[6]),
        end: new Date(holiday[7]),
        firstName: holiday[2],
        lastName: holiday[3],
        type: 'CP'
      };

      parsedResults[id] = objectifiedHoliday;
    });
  });

  for (var id in parsedResults) {
    var weeks = showHoliday(parsedResults[id]);
    weeks.forEach(showOneWeek);
  }
}

function showHoliday(holiday) {
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

    week.firstName = holiday.firstName;
    week.lastName = holiday.lastName;
    week.type = holiday.type;
    weeks.push(week);
    curDate = nextWeek(curDate);
  }

  return weeks;
}

exports.showHoliday = showHoliday;

function getWorkingWeek(date) {
  var weekStart = new Date(+date);
  var sundayDate = weekStart.getDate() - weekStart.getDay();
  // monday
  weekStart.setDate(sundayDate + 1);

  var weekEnd = new Date(+date);
  // friday
  weekEnd.setDate(sundayDate + 5);

  return {
    start: weekStart,
    end: weekEnd
  };
}

function getWeekStart(date) {
  var weekStart = new Date(+date);
  var sundayDate = weekStart.getDate() - weekStart.getDay();
  weekStart.setDate(sundayDate);
  return weekStart;
}

function nextWeek(date) {
  var oneWeek = 7 * 24 * 60 * 60 * 1000;
  var nextWeek = new Date(+date + oneWeek);
  return nextWeek;
}

function showOneWeek(week) {
  tabs.open({
    url: 'about:blank',
    onReady: function(tab) {
      var worker = tab.attach({
        contentScriptFile: data.url('results.js')
      });
      worker.port.emit('show', week);
    }
  });
}

// shamelessly taken from the Sms app template implementation
var interpolateRe = /\$\{([^}]+)\}/g;
function interpolate(str, data) {
  return str.replace(interpolateRe, function(match, property) {
    property = property.trim();
    return data[property] || '';
  });
}

function toUSDate(date) {
  return (date.getMonth() + 1) + '/' +
    date.getDate() + '/' +
    date.getFullYear();
}

init();

