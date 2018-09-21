/*jshint esnext: true */
/* global utcDate, Template, fakeData, restoreSavedValues, monthWeekTable, updateWeeksWithHolidays */

(function(exports) {
  'use strict';

  var templates = {
    ptoRow: new Template('form-row-template'),
    ptoCell: new Template('form-cell-template'),
    ptoSummary: new Template('form-summary-template')
  };

  // '-' is a type used for part-time employees to indicate non-working
  // days, so that those days are still counted as "jours ouvrés".
  var WORKING_DAY_TYPES = ['-', 'JT', 'CP', 'JRTT', 'M', 'CS'];

  var ptoTable = document.querySelector('.worked-days-table tbody');
  var ptoSummaryTable = document.querySelector('.summary');

  var DEFAULT_SUMMARY_VALUES = {
    totalWorkingDays: 0,
    '-': 0,
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

  // buttons interaction
  initButtonHandlers();

  generatePTOForm();

  function initCommunication() {
    // Get back the PTO holidays from the PTO tool.
    window.addEventListener('show-holidays', (e) => loadPTOData(e.detail));
  }

  function initButtonHandlers() {
    document.querySelector('#monthDown').addEventListener('click', changeMonthDown);
    document.querySelector('#monthUp').addEventListener('click', changeMonthUp);
  }

  function initFakeData() {
    if (window.location.protocol !== 'resource:') {
      // We're not in the addon
      loadPTOData(fakeData);
    }
  }

  function getDefaultState() {
    var state = {};
    var today = new Date();
    state.currentMonth = today.getUTCMonth();
    state.currentYear = today.getUTCFullYear();
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

  function loadPTOData(holidays) {
    state.holidays = holidays;
    if (state.hasOwnProperty("weeks")) {
      state.weeks = updateWeeksWithHolidays(state);
      generatePTOForm();
    }
  }

  function changeMonthUp() {
    state.currentMonth++;
    if (state.currentMonth > 12) {
      state.currentMonth = 1;
      state.currentYear++;
    }
    refreshWeeks();
    state.weeks = updateWeeksWithHolidays(state);
    generatePTOForm();
  }

  function changeMonthDown() {
    state.currentMonth--;
    if (state.currentMonth < 1) {
      state.currentMonth = 12;
      state.currentYear--;
    }
    refreshWeeks();
    state.weeks = updateWeeksWithHolidays(state);
    generatePTOForm();
  }

  function updateModel(weekId, dayId, type) {
    var nbHours = 8;
    if (type.startsWith("0.5") || type.startsWith("1/2") || type.startsWith("0,5")) {
      nbHours = 4;
    }
    if (type) {
      const extractTypeResult = /[A-Z]+/.exec(type.toUpperCase());
      if (extractTypeResult) {
        type = extractTypeResult[0];
      }
    }

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

    var currentMonthDate = utcDate(state.currentYear, state.currentMonth, 1);
    var summary = Object.assign({}, DEFAULT_SUMMARY_VALUES);

    state.weeks.forEach((week, week_id) => {
      var days = week.filter((i) => i !== null);
      var firstDay = days[0].date;
      var lastDay = days[days.length - 3].date;
      var interpolateData = {
        id: week_id,
        weekStart: firstDay.toLocaleDateString("fr-FR"),
        weekEnd: lastDay.toLocaleDateString("fr-FR"),
        weekStartUS: firstDay.toLocaleDateString('en-US'),
        weekEndUS: lastDay.toLocaleDateString('en-US'),
        cells: ''
      };

      week.forEach((day, day_id) => {
        var cellData;
        if ([0, 6].includes(day.date.getUTCDay())) {
          return;
        }

        if (!day.type) {
          cellData = {
            id: 'day-' + week_id + '_' + day_id,
            className: '',
            type: '',
            weekId: week_id,
            dayId: day_id,
            classError: ''
          };
          interpolateData.cells += templates.ptoCell.interpolate(cellData);
        } else {
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
    document.querySelector('.date-value').textContent = new Date().toLocaleDateString("fr-FR");

    setTimeout(() => window.dispatchEvent(new CustomEvent('table-displayed')));
    restoreSavedValues();
  }

  exports.updateModel = updateModel;
})(window);
