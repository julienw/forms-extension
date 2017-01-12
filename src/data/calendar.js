/* global utcDate, getBoxingDays, getFrenchBankHolidays */
(function(exports) {
  "use strict";

  function guessTypeFromComment(comment) {
    var KNOWN_TYPES = ['RTT', 'CP', 'CS'];
    var words = {'sick': 'M', 'malad': 'M', 'patho': 'M',
                 'wedding': 'CS', 'mariage': 'CS',
                 'maternité': 'CS', 'parental': 'CS', 'paternité': 'CS',
                 'sans solde': 'CS'};
    var type = KNOWN_TYPES.find(type => comment && comment.includes(type));
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

  function formatDateString(date) {
    return date.toLocaleString('en-GB', {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function monthWeekTable(year, month) {
    // month is in the range 1..12
    var firstOfMonth = utcDate(year, month, 1);
    var lastOfMonth = utcDate(year, month + 1, 0);
    var used = firstOfMonth.getDay() + 6 + lastOfMonth.getDate();
    var numberOfWeeks = Math.ceil(used / 7);

    var weeks = [];
    for (var i = 0; i < numberOfWeeks; i++) {
      weeks.push([{}, {}, {}, {}, {}, {}, {}]);
    }
    var firstWeekDayOfMonth = (firstOfMonth.getDay() - 1 + 7) % 7;

    var frenchBankHolidays = getFrenchBankHolidays(year)
    var bankHolidays = frenchBankHolidays
        .map((holiday) => formatDateString(holiday.date));
    var boxingDays = getBoxingDays(year, frenchBankHolidays)
        .map((holiday) => formatDateString(holiday.date));

    if (year < 2017) boxingDays = [];

    return weeks.map((week, weekIndex) => {
      return week.map((day, dayIndex) => {
        var globalIndex = weekIndex * 7 + dayIndex;
        var dayOfMonth = globalIndex - firstWeekDayOfMonth + 1;
        day.date = utcDate(year, month, dayOfMonth);

        if (day.date.getMonth() === month - 1) {
          var currentDate = formatDateString(day.date);
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
    state.holidays.forEach(({start, end, hours, comment}) => {
      // Handle case where holidays ends on a week-end
      while ([0, 6].includes(end.getDay())) {
        end.setDate(end.getDate() - 1);
      }

      // Is in current month?
      if (start.getMonth() <= state.currentMonth - 1 && start.getFullYear() <= state.currentYear &&
          end.getMonth() >= state.currentMonth - 1 && end.getFullYear() >= state.currentYear) {
        // Someday of this holiday are in the current month
        var type = guessTypeFromComment(comment);

        state.weeks.forEach(week => {
          week.forEach(day => {
            if (start <= day.date && end >= day.date) {
              var isLast = end.toJSON() === day.date.toJSON();
              if (day.type !== 'WE') {
                if (day.type == 'JT') {
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

})(typeof window === "object" ? window : exports);
