/*jshint esnext: true */
var templates = {
  week: Template('week-template')
};

var weeks;
var range = document.querySelector('.easy-selector-range');
var form = document.querySelector('.choose-weeks-form');

initRange();
initForm();

function show(holidays) {
  document.querySelector('.fake-button').hidden = true;
  doShow(holidays);
}

function doShow(holidays) {
  weeks = [];

  holidays.forEach(holiday => {
    holiday.forEach(week => {
      week.holidayWeek = getHolidayWeek(week);
      //delete week.holidayStart;
      //delete week.holidayEnd;
      weeks.push(week);
    });
  });

  weeks = sortAndMerge(weeks);
  configureRange();
  displayWeeks();
  onRangeChange();
}

function onRangeChange() {
  weeks.forEach((week, id) => {
    var limit = range.valueAsNumber;
    var input = document.querySelector(`.week-${id} input`);
    input.checked = id < limit;
  });
}

function initRange() {
  range.addEventListener('input', onRangeChange);
}

function initForm() {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    generatePTOForm();
  });
}

function generatePTOForm() {
  form.hidden = true;
}

function configureRange() {
  range.max = weeks.length;
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

function displayWeeks() {
  var form = document.querySelector('.choose-weeks-form');
  var opts = { day: "numeric", month: 'long', year: "numeric" };
  weeks.forEach((week, id) => {
    form.insertAdjacentHTML('beforeend', templates.week.interpolate({
      id,
      weekStart: week.start,
      weekEnd: week.end,
      weekStartText: week.start.toLocaleDateString(undefined, opts),
      weekEndText: week.end.toLocaleDateString(undefined, opts)
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

