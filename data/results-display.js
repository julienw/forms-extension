/*jshint esnext: true */
function show(weeks) {
  weeks.forEach(week => {
    week.holidayWeek = getHolidayWeek(week);
  });
  displayWeeks(weeks);
}

/**
 * Returns an array of 5 elements, with booleans indicating whether each day of
 * the week is part of the holiday.
 *
 * @returns {Array.<Boolean>}
 */
function getHolidayWeek(week) {
  var holidayWeek = new Array(5);
  var curDate = new Date(+week.start);
  var firstDay = curDate.getUTCDate();
  for (var i = 0; i < 5; i++) {
    curDate.setUTCDate(firstDay + i);
    holidayWeek[i] = week.holidayStart <= curDate && curDate <= week.holidayEnd;
  }
  return holidayWeek;
}

function displayWeeks(weeks) {
  var output = document.createElement('ul');
  for (var week of weeks) {
    var li = document.createElement('li');
    li.textContent = JSON.stringify(week);
    output.appendChild(li);
  }
  document.body.appendChild(output);
}

// taken from the gaia sms app
var rdashes = /-(.)/g;
function camelCase(str) {
  return str.replace(rdashes, function replacer(str, p1) {
    return p1.toUpperCase();
  });
}
