var expect = require('chai').expect;
var Calendar = require('../src/data/calendar');

const {utcDate, getFrenchBankHolidays, getBoxingDays} = require('../src/data/french-bank-holidays');
global.utcDate = utcDate;
global.getFrenchBankHolidays = getFrenchBankHolidays;
global.getBoxingDays = getBoxingDays;


describe("Calendar", () => {
  describe("#monthWeekTable()", () => {
    let weektable;

    beforeEach(() => {
      weekTable = Calendar.monthWeekTable(2017, 1);
    });

    it("should return a week array with the expected length", () => {
      expect(weekTable)
        .to.have.length.of(6);
    });

    it("should return a week array with the expected weeks length", () => {
      expect(weekTable.every(week => week.length === 7))
        .eql(true);
    });

    it("should return a week array with the null day type when not part of the month", () => {
      weekTable.forEach(days => {
        // ensure every day of each week has a null type whenever the day is not
        // part of the target month
        days.forEach(day => {
          if (day.date.getMonth() !== 0) {
            expect(day.type).to.be.a("null");
          } else if (day.date.getDay() === 0) {
            expect(day.type).eql("WE");
          } else {
            expect(day.type).to.be.a("string");
          }
        })
      });
    });
  });

  describe('#guessTypeFromComment', () => {
    it("should return CP for an empty comment.", () => {
      var type = Calendar.guessTypeFromComment("");
      expect(type).eql("CP");
    });

    it("should return CP by default.", () => {
      var type = Calendar.guessTypeFromComment("Sailing of the Britany coast.");
      expect(type).eql("CP");
    });

    it("should return CP for a comment containing CP.", () => {
      var type = Calendar.guessTypeFromComment("1 CP");
      expect(type).eql("CP");
    });

    it("should return JRTT for a comment containing RTT.", () => {
      var type = Calendar.guessTypeFromComment("RTT");
      expect(type).eql("JRTT");
    });

    it("should return CS for a comment containing CSS.", () => {
      var type = Calendar.guessTypeFromComment("CSS");
      expect(type).eql("CS");
    });

    it("should return CS for a comment containing sans solde.", () => {
      var type = Calendar.guessTypeFromComment("Quelques jours de congés sans solde");
      expect(type).eql("CS");
    });

    it("should return CS for a comment containing wedding.", () => {
      var type = Calendar.guessTypeFromComment("Few days off for my wedding.");
      expect(type).eql("CS");
    });

    it("should return CS for a comment containing wedding.", () => {
      var type = Calendar.guessTypeFromComment("Few days off for my wedding.");
      expect(type).eql("CS");
    });

    it("should return CS for a comment containing mariage.", () => {
      var type = Calendar.guessTypeFromComment("Quelques jours pour mon mariage.");
      expect(type).eql("CS");
    });

    it("should not return M when a comment contains the letter M", () => {
      var type = Calendar.guessTypeFromComment("My dog ran away");
      expect(type).eql("CP");
    });

    it("should return M for a comment containing Maladie.", () => {
      var type = Calendar.guessTypeFromComment("Maladie");
      expect(type).eql("M");
    });

    it("should return M for a comment containing maladie.", () => {
      var type = Calendar.guessTypeFromComment("maladie");
      expect(type).eql("M");
    });

    it("should return M for a comment containing malade.", () => {
      var type = Calendar.guessTypeFromComment("je suis malade");
      expect(type).eql("M");
    });

    it("should return M for a comment containing sickness.", () => {
      var type = Calendar.guessTypeFromComment("sickness");
      expect(type).eql("M");
    });

    it("should return M for a comment containing pathologique.", () => {
      var type = Calendar.guessTypeFromComment("pathologique");
      expect(type).eql("M");
    });

    it("should return M for a comment containing patho.", () => {
      var type = Calendar.guessTypeFromComment("patho");
      expect(type).eql("M");
    });

    it("should return CS for a comment containing maternité.", () => {
      var type = Calendar.guessTypeFromComment("maternité");
      expect(type).eql("CS");
    });

    it("should return CS for a comment containing parental.", () => {
      var type = Calendar.guessTypeFromComment("parental");
      expect(type).eql("CS");
    });

    it("should return CS for a comment containing paternité.", () => {
      var type = Calendar.guessTypeFromComment("paternité");
      expect(type).eql("CS");
    });

    it("should stop on the first word found..", () => {
      var type = Calendar.guessTypeFromComment("Some sickness days before my wedding.");
      expect(type).eql("M");
    });

  });

  describe("#updateWeeksWithHolidays()", () => {
    let state;

    beforeEach(() => {
      state = {
        weeks: Calendar.monthWeekTable(2017, 1),
        holidays: [{
          start: "2017-01-02T00:00:00.000Z",
          end: "2017-01-08T00:00:00.000Z",
          comment: 'RTT',
          hours: 32
        }],
        currentMonth: 1,
        currentYear: 2017
      };
    });

    it("should set the first week of January as a week of RTT", () => {
      var weeks = Calendar.updateWeeksWithHolidays(state);
      // The first week of January only contains Sunday 1st.
      expect(weeks[1])
        .eql([
          {'date': utcDate(2017, 1, 2),
           'hours': 8,
           'type': 'CS'
          },
          {'date': utcDate(2017, 1, 3),
           'hours': 8,
           'type': 'JRTT'
          },
          {'date': utcDate(2017, 1, 4),
           'hours': 8,
           'type': 'JRTT'
          },
          {'date': utcDate(2017, 1, 5),
           'hours': 4,
           'type': 'JRTT'
          },
          {'date': utcDate(2017, 1, 6),
           'hours': 4,
           'type': 'JRTT'
          },
          {'date': utcDate(2017, 1, 7),
           'hours': 8,
           'type': 'WE'
          },
          {'date': utcDate(2017, 1, 8),
           'hours': 8,
           'type': 'WE'
          }
        ]);
    });

    it("should handle last day as half day.", () => {
      state.holidays = [{
        start: "2017-01-02T00:00:00.000Z",
        end: "2017-01-08T00:00:00.000Z",
        comment: 'RTT',
        hours: 36
      }];

      var weeks = Calendar.updateWeeksWithHolidays(state);
      // The first week of January only contains Sunday 1st.
      expect(weeks[1])
        .eql([
          {'date': utcDate(2017, 1, 2),
           'hours': 8,
           'type': 'CS'
          },
          {'date': utcDate(2017, 1, 3),
           'hours': 8,
           'type': 'JRTT'
          },
          {'date': utcDate(2017, 1, 4),
           'hours': 8,
           'type': 'JRTT'
          },
          {'date': utcDate(2017, 1, 5),
           'hours': 8,
           'type': 'JRTT'
          },
          {'date': utcDate(2017, 1, 6),
           'hours': 4,
           'type': 'JRTT'
          },
          {'date': utcDate(2017, 1, 7),
           'hours': 8,
           'type': 'WE'
          },
          {'date': utcDate(2017, 1, 8),
           'hours': 8,
           'type': 'WE'
          }
        ]);
    });

    it("should handle two last days as half day.", () => {
      state.holidays = [{
        start: "2017-01-02T00:00:00.000Z",
        end: "2017-01-08T00:00:00.000Z",
        comment: 'RTT',
        hours: 32
      }];

      var weeks = Calendar.updateWeeksWithHolidays(state);
      // The first week of January only contains Sunday 1st.
      expect(weeks[1])
        .eql([
          {'date': utcDate(2017, 1, 2),
           'hours': 8,
           'type': 'CS'
          },
          {'date': utcDate(2017, 1, 3),
           'hours': 8,
           'type': 'JRTT'
          },
          {'date': utcDate(2017, 1, 4),
           'hours': 8,
           'type': 'JRTT'
          },
          {'date': utcDate(2017, 1, 5),
           'hours': 4,
           'type': 'JRTT'
          },
          {'date': utcDate(2017, 1, 6),
           'hours': 4,
           'type': 'JRTT'
          },
          {'date': utcDate(2017, 1, 7),
           'hours': 8,
           'type': 'WE'
          },
          {'date': utcDate(2017, 1, 8),
           'hours': 8,
           'type': 'WE'
          }
        ]);
    });
  });
});
