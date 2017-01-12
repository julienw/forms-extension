/*jshint esnext: true */

(function(exports) {
'use strict';

function utcDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

// Taken from https://github.com/commenthol/date-easter/blob/bbdd1a3/index.js#L53-L89
function _easter (year, julian, gregorian) {
    let k = Math.floor(year / 100)
    let m = 15 + Math.floor((3 * k + 3) / 4) - Math.floor((8 * k + 13) / 25)
    let s = 2 - Math.floor((3 * k + 3) / 4)
    if (julian) {
      m = 15
      s = 0
    }
    let a = year % 19
    let d = (19 * a + m) % 30
    let r = Math.floor((d + a / 11) / 29)
    let og = 21 + d - r
    let sz = 7 - Math.floor(year + year / 4 + s) % 7
    let oe = 7 - (og - sz) % 7
    let os = og + oe
    if (gregorian) {
      os = os + Math.floor(year / 100) - Math.floor(year / 400) - 2
    }
    //                      1   2   3   4   5   6   7   8
    let daysPerMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31]
    let day = os
    let month
    for (month = 3; month < 8; month++) {
      if (day <= daysPerMonth[month]) {
        break
      }
      day -= daysPerMonth[month]
    }

    return utcDate(year, month, day)
}

function sortHolidays(previous, current) {
  if (previous.date < current.date) {
    return -1;
  } else if (previous.date > current.date) {
    return 1;
  } else {
    return 0;
  }
}

function addDays(date, days) {
  return new Date(date.getTime() + (days * 86400 * 1000));
}

function isSaturday(date) {
  return date.getUTCDay() === 6;
}

function isSunday(date) {
  return date.getUTCDay() === 0;
}

function getFrenchBankHolidays(year) {
  const holidays = [
    {date: utcDate(year, 1, 1), name: 'New Years Day'},
    {date: utcDate(year, 5, 1), name: "Labour Day"},
    {date: utcDate(year, 5, 8), name: "Victory in Europe Day"},
    {date: utcDate(year, 7, 14), name: "Bastille Day"},
    {date: utcDate(year, 8, 15), name: "Assumption Day"},
    {date: utcDate(year, 11, 1), name: "All Saints Day"},
    {date: utcDate(year, 11, 11), name: "Armistice Day"},
    {date: utcDate(year, 12, 25), name: "Christmas Day"},
  ];

  // Include easter Monday
  let easter = _easter(year);
  let easterMonday = addDays(easter, 1);
  holidays.push({date: easterMonday, name: "Easter monday"});

  // Include ascension
  let ascensionThursday = addDays(easter, 39);
  holidays.push({date: ascensionThursday, name: "Ascension Thursday"});

  return holidays.slice(0).sort(sortHolidays);
}

function getBoxingDays(year, holidays) {
  const boxing = holidays.reduce((boxing, holiday) => {
    // When the holiday is a Saturday, the previous Friday is a holiday
    if (isSaturday(holiday.date)) {
      const previousFriday = addDays(holiday.date, -1)
      return [...boxing, {date: previousFriday, name: `${holiday.name} (observed)`}];
    }
    // When the holiday is a Sunday, the next Monday is a holiday
    if (isSunday(holiday.date)) {
      const nextMonday = addDays(holiday.date, 1)
      return [...boxing, {date: nextMonday, name: `${holiday.name} (observed)`}];
    }
    return boxing
  }, []);
  // Handle upcoming New Year's Day
  const nextNewYear = utcDate(year + 1, 1, 1);
  if (isSaturday(nextNewYear)) {
    boxing.push({date: utcDate(year, 12, 31), name: "New Years Day (observed)"});
  }
  return boxing;
}
exports.utcDate = utcDate;
exports.addDays = addDays;
exports.getFrenchBankHolidays = getFrenchBankHolidays;
exports.getBoxingDays = getBoxingDays;

})(typeof window === 'object' ? window : exports);
