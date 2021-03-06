/* global utcDate, getBoxingDays, getFrenchBankHolidays, getWellnessDays */
(function(exports) {
  "use strict";

  function guessTypeFromComment(comment) {
    var KNOWN_TYPES = ['RTT', 'CP', 'CS'];
    var words = {'sick': 'M', 'malad': 'M', 'patho': 'M',
                 'wedding': 'CS', 'mariage': 'CS',
                 'maternité': 'CS', 'parental': 'CS', 'paternité': 'CS',
                 'sans solde': 'CS',
                 'birthday': 'CS', 'anniversaire': 'CS'};
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

  /**
   * This function generates a table of weeks for a specific month.
   * It returns an array of:
   * {
   *   date: Date,
   *   type:
   *     | 'JF' // bank holidays
   *     | 'CS' // boxing days (in 2017 only)
   *     | 'WE' // week-end
   *     | 'JT' // normal day
   *     | null // this day isn't part of the month
   * }.
   *
   * Note that `month` is in the range 1..12, not 0..11. That's why there are
   * some decrement in the code.
   */
  function monthWeekTable(year, month) {
    var firstOfMonth = utcDate(year, month, 1);
    var lastOfMonth = utcDate(year, month + 1, 0);
    var used = firstOfMonth.getUTCDay() + 6 + lastOfMonth.getUTCDate();
    var numberOfWeeks = Math.ceil(used / 7);

    var weeks = [];
    for (var i = 0; i < numberOfWeeks; i++) {
      // 7 days in a week.
      weeks.push([{}, {}, {}, {}, {}, {}, {}]);
    }
    var firstWeekDayOfMonth = (firstOfMonth.getUTCDay() - 1 + 7) % 7;

    var frenchBankHolidays = getFrenchBankHolidays(year)
    var bankHolidays = frenchBankHolidays
        .map((holiday) => formatDateString(holiday.date));
    const wellnessDays = getWellnessDays(year)
        .map((holidayDate) => formatDateString(holidayDate));
    // Boxing days were tested only in 2017
    const boxingDays = year === 2017
      ? getBoxingDays(year, frenchBankHolidays)
        .map((holiday) => formatDateString(holiday.date))
      : [];

    return weeks.map((week, weekIndex) => {
      return week.map((day, dayIndex) => {
        var globalIndex = weekIndex * 7 + dayIndex;
        var dayOfMonth = globalIndex - firstWeekDayOfMonth + 1;
        day.date = utcDate(year, month, dayOfMonth);
        day.hours = 8;

        if ([0, 6].includes(day.date.getUTCDay())) {
          day.type = 'WE';
        } else if (day.date.getUTCMonth() === month - 1) {
          var currentDate = formatDateString(day.date);
          if (bankHolidays.includes(currentDate)) {
            day.type = 'JF';
          } else if (boxingDays.includes(currentDate)) {
            day.type = 'CS';
          } else if (wellnessDays.includes(currentDate)) {
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
    const startYear = startDate.getUTCFullYear();
    const startMonth = startDate.getUTCMonth() + 1;
    const endYear = endDate.getUTCFullYear();
    const endMonth = endDate.getUTCMonth() + 1;

    return (
            startYear < currentYear ||
            (startYear === currentYear && startMonth <= currentMonth)
           ) && (
            endYear > currentYear ||
            (endYear === currentYear && endMonth >= currentMonth)
           );
  }

  function isDayPartOfHolidays(day, startDate, endDate) {
    return startDate <= day.date && endDate >= day.date;
  }

  /**
   * The role of this function is to update the `state.weeks` (generated by
   * "monthWeekTable") to include the holidays as fetched from the PTO website
   * (stored in `state.holidays`).
   */
  function updateWeeksWithHolidays(state) {
    // Update the weeks data with the PTO infos for the current month.
    state.holidays.forEach(({start, end, comment}) => {
      let startDate = new Date(start);
      let endDate = new Date(end);

      // Break if holiday is not part of current Month
      if (!isInCurrentMonth(startDate, endDate, state)) {
        return;
      }

      // From the comment entered in the PTO website, we try to guess a holiday type.
      const guessedType = guessTypeFromComment(comment);

      // Note: this forEach loop will change the week data.
      state.weeks.forEach((week) => {
        // Process holiday information for this week
        week
          // Process only days part of current holiday perdiod
          .filter((day) => isDayPartOfHolidays(day, startDate, endDate))
          // Exclude week-ends
          .filter((day) => day.type !== "WE")
          // Update week working days information with holiday ones
          .forEach((day) => {
            day.hours = 8;
            if (day.type === "JT") {
              day.type = guessedType;
            }
          });
      });
    });
    return state.weeks;
  }

  exports.guessTypeFromComment = guessTypeFromComment;
  exports.monthWeekTable = monthWeekTable;
  exports.updateWeeksWithHolidays = updateWeeksWithHolidays;
  exports.isInCurrentMonth = isInCurrentMonth;

})(typeof window === "object" ? window : exports);
