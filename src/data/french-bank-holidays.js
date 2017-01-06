/*jshint esnext: true */

(function(exports) {
'use strict';

function _easter (year, julian, gregorian) {
    var k = Math.floor(year / 100)
    var m = 15 + Math.floor((3 * k + 3) / 4) - Math.floor((8 * k + 13) / 25)
    var s = 2 - Math.floor((3 * k + 3) / 4)
    if (julian) {
      m = 15
      s = 0
    }
    var a = year % 19
    var d = (19 * a + m) % 30
    var r = Math.floor((d + a / 11) / 29)
    var og = 21 + d - r
    var sz = 7 - Math.floor(year + year / 4 + s) % 7
    var oe = 7 - (og - sz) % 7
    var os = og + oe
    if (gregorian) {
      os = os + Math.floor(year / 100) - Math.floor(year / 400) - 2
    }
    //                      1   2   3   4   5   6   7   8
    var daysPerMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31]
    var day = os
    var month
    for (month = 3; month < 8; month++) {
      if (day <= daysPerMonth[month]) {
        break
      }
      day -= daysPerMonth[month]
    }

    return new Date(year, month - 1, day)
}

function getFrenchBankHolidays(year) {
  const FIXED_HOLIDAYS = [
    [1, 1, 'New year'],
    [5, 1, "Labour Day"],
    [5, 8, "Victory in Europe Day"],
    [7, 14, "Bastille Day"],
    [8, 15, "Assumption Day"],
    [11, 1, "All Saints Day"],
    [11, 11, "Armistice Day"],
    [12, 25, "Christmas Day"],
  ];

  let holidays = FIXED_HOLIDAYS.slice();
  
  // Include easter Monday
  var easter = _easter(year);
  var easterMonday = new Date(easter.getYear(), easter.getMonth(), easter.getDate() + 1);
  
  holidays.push([easterMonday.getMonth() + 1, easterMonday.getDate(), "Easter monday"]);
  
  // Include ascension
  var ascensionThursday = new Date(easter.getYear(), easter.getMonth(), easter.getDate() + 39);
  holidays.push([ascensionThursday.getMonth() + 1, ascensionThursday.getDate(), "Ascension Thursday"]);
  
  // Include whitMonday
  // At Mozilla France we do work during Whit Monday.
  // var whitMonday = new Date(easter.getYear(), easter.getMonth(), easter.getDate() + 50);
  // holidays.push([whitMonday.getMonth() + 1, whitMonday.getDate(), "Whit Monday"]);

  return holidays;
}
exports.getFrenchBankHolidays = getFrenchBankHolidays;

})(window);
