(function() {

var urlTemplate = 'https://intranet.mozilla.org/pto/export.php?format=json&' +
  'start_date_from=${startDateFrom}&start_date_to=${startDateTo}&' +
  'first_name=${firstName}&end_date_from=${endDateFrom}&' +
  'end_date_to=${endDateTo}&last_name=${lastName}&pto_table_length=100';

function init() {
  document.body.addEventListener('click', generate);
}

function generate(e) {
  if (e.target.localName !== 'button') {
    return;
  }

  var periodStart;

  switch(e.target.dataset.what) {
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
  function onGetJSON(e) {
    console.log(e.target.responseText);
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
  console.error(e.error);
}

function handleResult(results) {
  var parsedResults = {};
  results.forEach(function(result) {
    var holidays = result.aaData;
    holidays.forEach(function(holiday) {
      var id = holiday[1];
      var objectifiedHoliday = {
        id: id,
        start: holiday[5],
        end: holiday[6],
        firstName: holiday[2],
        lastName: holiday[3]
      };

      parsedResults[id] = objectifiedHoliday;
    });
  });

  showHolidays(parsedResults);
}

function showHolidays(holidays) {
  var output = document.getElementById('output');
  for (var id in holidays) {
    var holiday = holidays[id];
    var li = document.createElement('li');
    li.textContent = JSON.stringify(holiday);
    output.appendChild(li);
  }
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

})();
