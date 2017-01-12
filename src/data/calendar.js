/* global utcDate, addDays, getBoxingDays, getFrenchBankHolidays */
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
    var used = firstOfMonth.getUTCDay() + 6 + lastOfMonth.getUTCDate();
    var numberOfWeeks = Math.ceil(used / 7);

    var weeks = [];
    for (var i = 0; i < numberOfWeeks; i++) {
      weeks.push([{}, {}, {}, {}, {}, {}, {}]);
    }
    var firstWeekDayOfMonth = (firstOfMonth.getUTCDay() - 1 + 7) % 7;

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

        if (day.date.getUTCMonth() === month - 1) {
          var currentDate = formatDateString(day.date);
          day.hours = 8;
          if ([0, 6].includes(day.date.getUTCDay())) {
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

  function isInCurrentMonth(startDate, endDate, {currentMonth, currentYear}) {
    return startDate.getUTCMonth() <= currentMonth - 1 &&
           startDate.getUTCFullYear() <= currentYear &&
           endDate.getUTCMonth() >= currentMonth - 1 &&
           endDate.getUTCFullYear() >= currentYear;
  }

  function isDayPartOfHolidays(day, startDate, endDate) {
    return startDate <= day.date && endDate >= day.date;
  }

  function isWeekend(date) {
    return [0, 6].includes(date.getUTCDay());
  }

  function updateWeeksWithHolidays(state) {
    // Update the weeks data with the PTO infos for the current month.
    state.holidays.forEach(({start, end, hours, comment}) => {
      let startDate = new Date(start);
      let endDate = new Date(end);

      // Handle case where holidays ends on a week-end
      while (isWeekend(endDate)) {
        endDate = addDays(endDate, -1);
      }

      // Break if holiday is not part of current Month
      if (!isInCurrentMonth(startDate, endDate, state)) {
        return;
      }

      const guessedType = guessTypeFromComment(comment);

      state.weeks.forEach((week) => {
        // Process holiday information for this week
        week
          // Process only days part of current holiday perdiod
          .filter((day) => isDayPartOfHolidays(day, startDate, endDate))
          // Exclude week-ends
          .filter((day) => day.type !== "WE")
          // Update week working days information with holiday ones
          .forEach((day) => {
            const isLast = endDate.toJSON() === day.date.toJSON();
            if (day.type === "JT") {
              day.type = guessedType;
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
        });
      });
    });
    return state.weeks;
  }

  exports.guessTypeFromComment = guessTypeFromComment;
  exports.monthWeekTable = monthWeekTable;
  exports.updateWeeksWithHolidays = updateWeeksWithHolidays;

})(typeof window === "object" ? window : exports);
