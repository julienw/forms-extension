(function(exports) {
  "use strict";

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

  exports.guessTypeFromComment = guessTypeFromComment;
  exports.monthWeekTable = monthWeekTable;
})(typeof window === "object" ? window : exports);
