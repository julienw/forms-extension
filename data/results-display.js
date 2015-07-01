/*jshint esnext: true */
function show(holidays) {
  var weeks = [];

  holidays.forEach(holiday => {
    holiday.forEach(week => {
      week.holidayWeek = getHolidayWeek(week);
      //delete week.holidayStart;
      //delete week.holidayEnd;
      weeks.push(week);
    });
  });

  weeks = sortAndMerge(weeks);
  displayWeeks(weeks);
}

/**
 * Inversely chronologically sort the weeks, and merge identical ones.
 *
 * We expect weeks to be properly structured already.
 */
function sortAndMerge(weeks) {
  weeks = weeks.sort((weekA, weekB) => weekB.start - weekA.start);

  weeks = weeks.reduce((weeks, week) => {
    if (!weeks.length) {
      weeks.push(week);
      return weeks;
    }

    var previous = weeks[weeks.length - 1];
    if (+previous.start === +week.start) {
      // same week => merge to the previous one
      previous.holidayWeek = previous.holidayWeek.map(
        (bool, i) => bool || week.holidayWeek[i]
      );
      return weeks;
    }

    weeks.push(week);
    return weeks;
  }, []);

  return weeks;
}

/**
 * Returns an array of 5 elements, with booleans indicating whether each day of
 * the week is part of the holiday.
 *
 * @returns {Array.<Boolean>}
 */
function getHolidayWeek(week) {
  // convert back from json
  ['start', 'end', 'holidayStart', 'holidayEnd'].forEach(prop => {
    week[prop] = new Date(week[prop]);
  });

  var holidayWeek = new Array(5);
  var firstDay = week.start.getUTCDate();
  for (var i = 0; i < 5; i++) {
    var curDate = new Date(+week.start);
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
