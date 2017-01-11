/* global getBoxingDays, getFrenchBankHolidays */
(function(exports) {
  "use strict";

  var WORKING_DAY_TYPES = ['JT', 'CP', 'JRTT', 'M'];



  function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
      // Make sure the first letter of each word is Upper Case.
      return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
  }

  function guessTypeFromComment(comment) {
    var KNOWN_TYPES = ['RTT', 'CP', 'CS', 'M'];
    var words = {'sick': 'M', 'maladie': 'M', 'patho': 'M',
                 'wedding': 'CS', 'mariage': 'CS',
                 'maternité': 'CS', 'parental': 'CS', 'paternité': 'CS',
                 'sans solde': 'CS'};
    var type = KNOWN_TYPES.find(type => comment && toTitleCase(comment).includes(type));
    if (type == 'RTT') type = 'JRTT';
    Object.keys(words).some(word => {
      if (comment && comment.toLowerCase().includes(word)) {
        type = words[word];
        return true;
      }
      return false;
    });
    return type || 'CP';
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

    var frenchBankHolidays = getFrenchBankHolidays(year)
    var bankHolidays = frenchBankHolidays
        .map(holiday => year + "-" + zfill(holiday[0]) + "-" + zfill(holiday[1]));
    var boxingDays = getBoxingDays(year, frenchBankHolidays)
        .map(holiday => year + "-" + zfill(holiday[0]) + "-" + zfill(holiday[1]));

    if (year < 2017) boxingDays = [];

    return weeks.map((week, weekIndex) => {
      return week.map((day, dayIndex) => {
        var globalIndex = weekIndex * 7 + dayIndex;
        var dayOfMonth = globalIndex - firstWeekDayOfMonth + 1;
        day.date = new Date(year, month_number-1, dayOfMonth);

        if (day.date.getMonth() === month_number - 1) {
          var currentDate = year + "-" + zfill(day.date.getMonth() + 1) + "-" + zfill(dayOfMonth);
          day.hours = 8;
          if ([0, 6].includes(day.date.getDay())) {
            day.hours = 8;
            day.type = 'WE';
          } else if (bankHolidays.includes(currentDate)) {
            day.type = 'JF';
          } else if (boxingDays.includes(currentDate)) {
            day.type = 'CS';
          } else {
            day.type = 'JT';
          }
        } else {
          day.type = null;
        }
        return day;
      });
    });
  }

  function updateWeeksWithHolidays(state) {
    // Update the weeks data with the PTO infos for the current month.
    state.holidays.forEach((holiday) => {
      // Is in current month?
      var start = new Date(holiday.start);
      var end = new Date(holiday.end);

      // Handle case where holidays ends on a week-end
      while ([0, 6].includes(end.getDay())) {
        end.setDate(end.getDate() - 1);
      }

      if (start.getMonth() <= state.currentMonth - 1 && start.getFullYear() <= state.currentYear &&
          end.getMonth() >= state.currentMonth -1 && end.getFullYear() >= state.currentYear) {
        // Someday of this holiday are in the current month
        var hours = holiday.hours;
        var type = guessTypeFromComment(holiday.comment);

        state.weeks.forEach(week => {
          week.forEach(day => {
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
    return state.weeks;
  }

  exports.guessTypeFromComment = guessTypeFromComment;
  exports.monthWeekTable = monthWeekTable;
  exports.updateWeeksWithHolidays = updateWeeksWithHolidays;
  exports.WORKING_DAY_TYPES = WORKING_DAY_TYPES;

})(typeof window === "object" ? window : exports);
