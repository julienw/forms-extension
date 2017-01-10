var expect = require('chai').expect;
var Calendar = require('../src/data/calendar');

const {getFrenchBankHolidays, getBoxingDays} = require('../src/data/french-bank-holidays');
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

    it("should return M for a comment containing M.", () => {
      var type = Calendar.guessTypeFromComment("M");
      expect(type).eql("M");
    });

    it("should return M for a comment containing Maladie.", () => {
      var type = Calendar.guessTypeFromComment("Maladie");
      expect(type).eql("M");
    });

    it("should return M for a comment containing maladie.", () => {
      var type = Calendar.guessTypeFromComment("maladie");
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
});
