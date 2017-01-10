/*jshint esnext: true */

(function(exports) {
  'use strict';

  var templates = {
    ptoRow: new Template('form-row-template'),
    ptoCell: new Template('form-cell-template'),
    ptoSummary: new Template('form-summary-template')
  };

  var state = {};
  var weeks;
  var range = document.querySelector('.easy-selector-range');
  var form = document.querySelector('.choose-weeks-form');
  var sections = {
    choose: document.querySelector('.choose-form'),
    pto: document.querySelector('.pto-form')
  };
  var future = document.querySelector('.show-future-checkbox');
  var ptoTable = document.querySelector('.worked-days-table tbody');
  var ptoSummaryTable = document.querySelector('.summary');

  var WORKING_DAY_TYPES = ['JT', 'CP', 'JRTT', 'M'];

  var DEFAULT_SUMMARY_VALUES = {
    totalWorkingDays: 0,
    JT: 0,
    JF: 0,
    M: 0,
    CP: 0,
    JRTT: 0,
    CS: 0,
  };

  var state = getDefaultState();
  refreshWeeks();

  // Load PTO data
  initCommunication();
  initFakeData();

  generatePTOForm();

  function initCommunication() {
    // Get back the PTO holidays from the PTO tool.
    window.addEventListener('show-holidays', (e) => loadPTOData(e.detail, true));
  }

  function initFakeData() {
    if (window.location.protocol !== 'resource:') {
      // We're not in the addon
      loadPTOData(fakeData, true);
    }
  }

  function getDefaultState() {
    var state = {};
    var today = new Date();
    state.currentMonth = today.getMonth();
    state.currentYear = today.getFullYear();
    if (state.currentMonth === 0) {
      state.currentMonth = 12;
      --state.currentYear;
    }
    return state;
  }

  function refreshWeeks() {
    state.weeks = monthWeekTable(state.currentYear, state.currentMonth)
        .filter(week => week.some(day => ![null, 'WE'].includes(day.type)));
  }

  function loadPTOData(holidays, refresh) {
    state.holidays = holidays;
    if (state.hasOwnProperty("weeks")) {
      updateWeeksWithHolidays();
      if (refresh === true) {
        generatePTOForm();
      }
    }
  }

  function zfill(val) {
    return ("0" + val).slice(-2);
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

    var frenchBankHolidays = getFrenchBankHolidays(year)
    var bankHolidays = frenchBankHolidays
        .map(holiday => year + "-" + zfill(holiday[0]) + "-" + zfill(holiday[1]));
    var boxingDays = getBoxingDays(year, frenchBankHolidays)
        .map(holiday => year + "-" + zfill(holiday[0]) + "-" + zfill(holiday[1]));

    if (year < 2017) boxingDays = [];

    weeks.forEach((week, weekIndex) => {
      week.forEach((day, dayIndex) => {
        var weekHasDays = false;
        var globalIndex = weekIndex * 7 + dayIndex;
        var dayOfMonth = globalIndex - firstWeekDayOfMonth + 1;

        day.date = new Date(year, month_number-1, dayOfMonth);

        if ([0, 6].includes(day.date.getDay())) {
          day.hours = 8;
          day.type = 'WE';
        } else if (day.date.getMonth() === month_number - 1) {
          var currentDate = year + "-" + zfill(day.date.getMonth() + 1) + "-" + zfill(dayOfMonth);
          day.hours = 8;
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

    return weeks;
  }

  function updateWeeksWithHolidays() {
    // Update the weeks data with the PTO infos for the current month.
    state.holidays.forEach((holiday) => {
      // Is in current month?
      var start = new Date(holiday.start);
      var end = new Date(holiday.end);

      if (start.getMonth() <= state.currentMonth - 1 && start.getFullYear() <= state.currentYear &&
          end.getMonth() >= state.currentMonth -1 && end.getFullYear() >= state.currentYear) {
        // Someday of this holiday are in the current month
        var hours = holiday.hours;
        var type = Utils.guessTypeFromComment(holiday.comment) || 'CP';

        state.weeks.forEach((week, weekIndex) => {
          week.forEach((day, dayIndex) => {
            var currentDayText = day.date.getFullYear() + '-' + zfill(day.date.getMonth() - 1) + '-' + zfill(day.date.getDate());
            var startDayText = start.getFullYear() + '-' + zfill(start.getMonth() - 1) + '-' + zfill(start.getDate());
            var endDayText = end.getFullYear() + '-' + zfill(end.getMonth() - 1) + '-' + zfill(end.getDate());

            if (startDayText <= currentDayText && endDayText >= currentDayText) {
              var isLast = endDayText == currentDayText;
              if (day.type !== 'WE') {
                if (WORKING_DAY_TYPES.includes(day.type)) {
                  day.type = type;
                  // If there is still more than 8 hours, it is probably a full day off
                  if (hours > 8) {
                    hours -= 8;
                  } else if (hours > 0) {
                    if (!isLast) {
                      day.hours = 4;
                      hours -= 4;
                    } else {
                      // If there is less, it is probably an half day off.
                      day.hours = hours;
                      hours = 0;
                    }
                  }
                } else {
                  // A CS or JF is always 8 hours
                  hours -= 8;
                }
              }
            }
          });
        });
      }
    });
  }

  function changeMonthUp() {
    state.currentMonth++;
    if (state.currentMonth > 12) {
      state.currentMonth = 1;
      state.currentYear++;
    }
    refreshWeeks();
    updateWeeksWithHolidays();
    generatePTOForm();
  }

  function changeMonthDown() {
    state.currentMonth--;
    if (state.currentMonth < 1) {
      state.currentMonth = 12;
      state.currentYear--;
    }
    refreshWeeks();
    updateWeeksWithHolidays();
    generatePTOForm();
  }

  function updateModel(weekId, dayId, type) {
    var nbHours = 8;
    if (type.startsWith("0.5") || type.startsWith("1/2") || type.startsWith("0,5")) {
      nbHours = 4;
    }
    type = /[A-Z]+/.exec(type.toUpperCase())[0];

    const day = state.weeks[weekId][dayId];
    day.type = type;
    day.hours = nbHours;
    day.error = !Object.keys(DEFAULT_SUMMARY_VALUES).includes(type);

    generatePTOForm();
  }

  function setSummary(currentMonthDate, options) {
    var interpolateSummaryData = Object.assign({
      month: currentMonthDate.toLocaleString('en-us', {month: "long", year: "numeric"}),
    }, DEFAULT_SUMMARY_VALUES, options);

    ptoSummaryTable.innerHTML = templates.ptoSummary.interpolate(interpolateSummaryData);
  }

  function generatePTOForm() {
    ptoTable.innerHTML = '';

    var currentMonthDate = new Date(state.currentYear, state.currentMonth - 1, 1);
    var summary = Object.assign({}, DEFAULT_SUMMARY_VALUES);

    state.weeks.forEach((week, week_id) => {
      var days = week.filter((i) => i !== null);
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
            type: '',
            weekId: week_id,
            dayId: day_id
          };
          interpolateData.cells += templates.ptoCell.interpolate(cellData);
        } else  if (![0, 6].includes(day.date.getDay())) {
          // Increment counters
          summary[day.type] += day.hours / 8;
          summary.JT += 1 - (day.hours / 8);
          if (WORKING_DAY_TYPES.includes(day.type)) {
            summary.totalWorkingDays++;
          }

          cellData = {
            id: 'day-' + week_id + '_' + day_id,
            className: 'has-content',
            type: (day.hours === 4 ? '0.5 ' : '') + day.type,
            weekId: week_id,
            dayId: day_id,
            classError: day.error ? 'erroneous' : ''
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

    setSummary(currentMonthDate, summary);
    document.querySelector('.date-value').textContent = new Date().toLocaleDateString();
    sections.pto.hidden = false;

    setTimeout(() => window.dispatchEvent(new CustomEvent('table-displayed')));
    restoreSavedValues();
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

  exports.changeMonthUp = changeMonthUp;
  exports.changeMonthDown = changeMonthDown;
  exports.updateModel = updateModel;
  exports.Debug = {
    debugMyData() {
      return { weeks, holidays };
    }
  };

})(window);
