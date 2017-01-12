/*jshint esnext: true */

(function(exports) {
'use strict';

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

    return new Date(year, month - 1, day)
}

function sortHolidays(previousDay, currentDay) {
  // Compare months
  if (previousDay[0] < currentDay[0]) return -1;
  if (previousDay[0] > currentDay[0]) return 1;
  // Compare days
  if (previousDay[1] < currentDay[1]) return -1;
  if (previousDay[1] > currentDay[1]) return 1;
  return 0;
}

function addDays(date, days) {
  return new Date(date.getTime() + (days * 86400 * 1000))
}

function isSaturday(date) {
  return date.getDay() === 6;
}

function isSunday(date) {
  return date.getDay() === 0;
}

function getFrenchBankHolidays(year) {
  const holidays = [
    [1, 1, 'New Years Day'],
    [5, 1, "Labour Day"],
    [5, 8, "Victory in Europe Day"],
    [7, 14, "Bastille Day"],
    [8, 15, "Assumption Day"],
    [11, 1, "All Saints Day"],
    [11, 11, "Armistice Day"],
    [12, 25, "Christmas Day"],
  ];

  // Include easter Monday
  let easter = _easter(year);
  let easterMonday = addDays(easter, 1);

  holidays.push([easterMonday.getMonth() + 1, easterMonday.getDate(), "Easter monday"]);

  // Include ascension
  let ascensionThursday = addDays(easter, 39);
  holidays.push([ascensionThursday.getMonth() + 1, ascensionThursday.getDate(), "Ascension Thursday"]);

  return holidays.sort(sortHolidays);
}

function getBoxingDays(year, holidays) {
  const boxing = holidays.reduce((boxing, holiday) => {
    let holidayDate = new Date(year, holiday[0] - 1, holiday[1]);
    // When the holiday is a Saturday, the previous Friday is a holiday
    if (isSaturday(holidayDate)) {
      // XXX when holidays use dates, addDays(holiday, -7)
      let previousFriday = new Date(year, holiday[0] - 1, holiday[1] - 1);
      return [...boxing, [previousFriday.getMonth() + 1, previousFriday.getDate(), holiday[2] + " (observed)"]];
    }
    // When the holiday is a Sunday, the next Monday is a holiday
    if (isSunday(holidayDate)) {
      let nextMonday = new Date(year, holiday[0] - 1, holiday[1] + 1);
      return [...boxing, [nextMonday.getMonth() + 1, nextMonday.getDate(), holiday[2] + " (observed)"]];
    }
    return boxing
  }, []);
  let nextNewYear = new Date(year + 1, 0, 1);
  if (isSaturday(nextNewYear)) {
    boxing.push([12, 31, "New Years Day (observed)"]);
  }
  return boxing;
}
exports.getFrenchBankHolidays = getFrenchBankHolidays;
exports.getBoxingDays = getBoxingDays;

})(typeof window === 'object' ? window : exports);
