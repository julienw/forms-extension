/*jshint esnext: true */

(function(exports) {
'use strict';

var templates = {
  ptoRow: new Template('form-row-template'),
  ptoCell: new Template('form-cell-template')
};

var currentMonth;
var currentYear;
var holidays;
var range = document.querySelector('.easy-selector-range');
var form = document.querySelector('.choose-weeks-form');
var sections = {
  choose: document.querySelector('.choose-form'),
  pto: document.querySelector('.pto-form')
};
var future = document.querySelector('.show-future-checkbox');
var ptoTable = document.querySelector('.worked-days-table');

initData();
initFakeData();


function initData() {
  // Setup default value
  if (currentMonth == undefined || currentYear == undefined) {
    var today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getYear();
    if (currentMonth === 0) {
      currentMonth = 12;
      --currentYear;
    }
  }
}

function initFakeData() {
  if (window.location.protocol !== 'resource:') {
    currentMonth = 1;
    currentYear = 2017;
    generatePTOForm();
  }
}

function monthWeekTable(year, month_number) {

  // month_number is in the range 1..12

  var firstOfMonth = new Date(year, month_number-1, 1);
  var lastOfMonth = new Date(year, month_number, 0);
  var used = firstOfMonth.getDay() + 6 + lastOfMonth.getDate();
  var numberOfWeeks = Math.ceil( used / 7);

  var weeks = [];
  for (var i = 0; i < numberOfWeeks; i++) {
    weeks.push([{}, {}, {}, {}, {}, {}, {}]);
  }

  var firstWeekDayOfMonth = (firstOfMonth.getDay() - 1 + 7) % 7;
  var numberOfDayInMonth = lastOfMonth.getDate();

  var currentDayOfWeek = firstWeekDayOfMonth;
  var currentWeekNumber = 0;

  console.log(month_number, year);

  let zfill = (val) => ("0" + val).slice(-2);

  var frenchBankHolidays = getFrenchBankHolidays(year)
  var bankHolidays = frenchBankHolidays
      .map(holiday => year + "-" + zfill(holiday[0]) + "-" + zfill(holiday[1]));
  var boxingDays = getBoxingDays(year, frenchBankHolidays)
      .map(holiday => year + "-" + zfill(holiday[0]) + "-" + zfill(holiday[1]));

  console.log(bankHolidays.sort(), boxingDays.sort());

  weeks.forEach((week, weekIndex) => {
    week.forEach((day, dayIndex) => {
      var weekHasDays = false;
      var globalIndex = weekIndex * 7 + dayIndex;
      var dayOfMonth = globalIndex - firstWeekDayOfMonth + 1;

      day.date = new Date(year, month_number-1, dayOfMonth);

      if ([0, 6].includes(day.date.getDay())) {
        day.type = 'WE';
      } else if (day.date.getMonth() === month_number - 1) {
        var currentDate = year + "-" + zfill(day.date.getMonth() + 1) + "-" + zfill(dayOfMonth);
        if (bankHolidays.includes(currentDate)) {
          day.type = 'JF';
        } else if (boxingDays.includes(currentDate)) {
          day.type = 'CS';
        } else {
          day.type = 'JT';
        }
      } else {
        day.type = null;
      }
    });
  });

  console.log(JSON.stringify(weeks, null, 2));

  return weeks;
}


function generatePTOForm() {
  var weeksToDisplay = monthWeekTable(currentYear, currentMonth)
      .filter(week => week.some(day => ![null, 'WE'].includes(day.type)));

  console.log(weeksToDisplay);

  weeksToDisplay.forEach((week, week_id) => {
    var days = week.filter((i) => i !== null);
    console.log(days);
    var firstDay = days[0].date;
    var lastDay = days[days.length - 3].date;
    var interpolateData = {
      id: week_id,
      weekStart: firstDay.toLocaleDateString(),
      weekEnd: lastDay.toLocaleDateString(),
      weekStartUS: firstDay.toLocaleDateString('en-US'),
      weekEndUS: lastDay.toLocaleDateString('en-US'),
      cells: ''
    };

    week.forEach((day, day_id) => {
      var cellData;
      if (!day.type) {
        cellData = {
          id: 'day-' + week_id + '_' + day_id,
          className: '',
          type: ''
        };
        interpolateData.cells += templates.ptoCell.interpolate(cellData);
      } else  if (![0, 6].includes(day.date.getDay())) {
        cellData = {
          id: 'day-' + week_id + '_' + day_id,
          className: 'has-content',
          type: day.type
        };
        interpolateData.cells += templates.ptoCell.interpolate(cellData);
      }
    });

    /* Data is sanitized by the Template library. */
    ptoTable.insertAdjacentHTML(
      'beforeend',
      templates.ptoRow.interpolate(
        interpolateData, { safe: ['cells']}
      )
    );
  });

  document.querySelector('.date-value').textContent = new Date().toLocaleDateString();
  sections.pto.hidden = false;

  setTimeout(() => window.dispatchEvent(new CustomEvent('table-displayed')));
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

function findFuture(weeks) {
  weeks.forEach((week) => {
    week.future = week.end > Date.now();
  });
}

/**
 * Returns an array of 5 elements, with booleans indicating whether each day of
 * the week is part of the holiday.
 *
 * @returns {Array.<Integer>} < 0 if it's not an holiday, or the holiday index
 */
function getHolidayWeek(week, holidayIdx) {
  // convert back from json
  ['start', 'end', 'holidayStart', 'holidayEnd'].forEach(prop => {
    week[prop] = new Date(week[prop]);
  });

  var holidayWeek = new Array(5);
  var firstDay = week.start.getUTCDate();
  for (var i = 0; i < 5; i++) {
    var curDate = new Date(+week.start);
    curDate.setUTCDate(firstDay + i);
    var isHoliday = week.holidayStart <= curDate && curDate <= week.holidayEnd;
    holidayWeek[i] = isHoliday ? holidayIdx : -1;
  }
  return holidayWeek;
}

function displayWeeks() {
  var form = document.querySelector('.choose-weeks-form');
  var opts = { day: "numeric", month: 'long', year: "numeric" };
  weeks.forEach((week, id) => {
    /* Data is sanitized by the Template library. */
    form.insertAdjacentHTML('beforeend', templates.week.interpolate({
      id,
      weekStart: week.start,
      weekEnd: week.end,
      weekStartText: week.start.toLocaleDateString(undefined, opts),
      weekEndText: week.end.toLocaleDateString(undefined, opts),
      futureClass: week.future ? 'week-future' : ''
    }));
  });
}

// taken from the gaia sms app
var rdashes = /-(.)/g;
function camelCase(str) {
  return str.replace(rdashes, function replacer(str, p1) {
    return p1.toUpperCase();
  });
}

exports.generateForm = show;
exports.Debug = {
  debugMyData() {
    return { weeks, holidays };
  }
};

})(window);
