/*jshint esnext: true */
var templates = {
  week: Template('week-template'),
  ptoWeek: Template('form-row-template')
};

var weeks;
var range = document.querySelector('.easy-selector-range');
var form = document.querySelector('.choose-weeks-form');
var sections = {
  choose: document.querySelector('.choose-form'),
  pto: document.querySelector('.pto-form')
};
var future = document.querySelector('.show-future-checkbox');
var ptoTable = document.querySelector('.worked-days-table');

initRange();
initForm();
initFuture();
initFakeData();

function initFakeData() {
  if (window.location.protocol !== 'resource:') {
    // we're not in the addon
    show(fakeData);
  }
}

function show(holidays) {
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
  findFuture(weeks);
  configureRange();
  displayWeeks();
  onRangeChange();
}

function onRangeChange() {
  weeks.forEach((week, id) => {
    var limit = range.valueAsNumber;
    var input = document.querySelector(`.week-${id} input`);
    input.checked = id < limit;
    onCheckboxChange(input);
  });
}

function initRange() {
  range.addEventListener('input', onRangeChange);
}

function onCheckboxChange(checkbox) {
  checkbox.parentNode.classList.toggle('selected', checkbox.checked);
}

function initForm() {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    generatePTOForm();
  });

  form.addEventListener('change', (e) => {
    if (e.target.matches('input[type=checkbox]')) {
      onCheckboxChange(e.target);
    }
  });
}

function initFuture() {
  future.addEventListener('change', () => {
    form.classList.toggle('hide-future', !future.checked);
  });
}

function generatePTOForm() {
  sections.choose.hidden = true;
  var weeksToDisplay = weeks.filter((week, id) => {
    var includeFuture = future.checked;
    var isFuture = week.future;
    var input = document.querySelector(`.week-${id} input`);
    var isChecked = input.checked;

    return (!isFuture || includeFuture) && isChecked;
  });
  weeksToDisplay.forEach((week, id) => {
    var interpolateData = {
      id,
      weekStart: week.start.toLocaleDateString(),
      weekEnd: week.end.toLocaleDateString(),
      weekStartUS: week.start.toLocaleDateString('en-US'),
      weekEndUS: week.end.toLocaleDateString('en-US')
    };

    interpolateData.total = week.holidayWeek.filter((isHoliday, i) => {
      interpolateData[`day${i}`] = isHoliday || '';
      return isHoliday;
    }).length;

    ptoTable.insertAdjacentHTML(
      'beforeend', templates.ptoWeek.interpolate(interpolateData)
    );
  });
  sections.pto.hidden = false;
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

function findFuture(weeks) {
  weeks.forEach((week) => {
    week.future = week.end > Date.now();
  });
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
    var isHoliday = week.holidayStart <= curDate && curDate <= week.holidayEnd;
    holidayWeek[i] = isHoliday && (week.type || 'CP');
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

