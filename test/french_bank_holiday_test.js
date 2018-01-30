var expect = require('chai').expect;
var {
  utcDate,
  addDays,
  getFrenchBankHolidays,
  getBoxingDays,
} = require('../src/data/french-bank-holidays.js');

describe("French Bank Holidays", () => {
  describe("#addDays()", () => {
    it("should add days", () => {
      expect(addDays(utcDate(2017, 1, 1), 1))
        .eql(utcDate(2017, 1, 2));
    });

    it("should substract days", () => {
      expect(addDays(utcDate(2017, 1, 1), -1))
        .eql(utcDate(2016, 12, 31));
    });
  });

  describe('#getFrenchBankHolidays', () => {
    it("should return 2016 holidays", () => {
      var holidays2016 = getFrenchBankHolidays(2016);
      expect(holidays2016).eql([
        {date: utcDate(2016, 1, 1), name: 'New Years Day'},
        {date: utcDate(2016, 3, 28), name: 'Easter monday'},
        {date: utcDate(2016, 5, 1), name: 'Labour Day'},
        {date: utcDate(2016, 5, 5), name: 'Ascension Thursday'},
        {date: utcDate(2016, 5, 8), name: 'Victory in Europe Day'},
        {date: utcDate(2016, 7, 14), name: 'Bastille Day'},
        {date: utcDate(2016, 8, 15), name: 'Assumption Day'},
        {date: utcDate(2016, 11, 1), name: 'All Saints Day'},
        {date: utcDate(2016, 11, 11), name: 'Armistice Day'},
        {date: utcDate(2016, 12, 25), name: 'Christmas Day'},
      ]);
    });

    it("should return 2017 holidays", () => {
      var holidays2017 = getFrenchBankHolidays(2017);
      expect(holidays2017).eql([
        {date: utcDate(2017, 1, 1), name: 'New Years Day'},
        {date: utcDate(2017, 4, 17), name: 'Easter monday'},
        {date: utcDate(2017, 5, 1), name: 'Labour Day'},
        {date: utcDate(2017, 5, 8), name: 'Victory in Europe Day'},
        {date: utcDate(2017, 5, 25), name: 'Ascension Thursday'},
        {date: utcDate(2017, 7, 14), name: 'Bastille Day'},
        {date: utcDate(2017, 8, 15), name: 'Assumption Day'},
        {date: utcDate(2017, 11, 1), name: 'All Saints Day'},
        {date: utcDate(2017, 11, 11), name: 'Armistice Day'},
        {date: utcDate(2017, 12, 25), name: 'Christmas Day'},
      ]);
    });

    it("should return 2018 holidays", () => {
      var holidays2018 = getFrenchBankHolidays(2018);
      expect(holidays2018).eql([
        {date: utcDate(2018, 1, 1), name: 'New Years Day'},
        {date: utcDate(2018, 4, 2), name: 'Easter monday'},
        {date: utcDate(2018, 5, 1), name: 'Labour Day'},
        {date: utcDate(2018, 5, 8), name: 'Victory in Europe Day'},
        {date: utcDate(2018, 5, 10), name: 'Ascension Thursday'},
        {date: utcDate(2018, 7, 14), name: 'Bastille Day'},
        {date: utcDate(2018, 8, 15), name: 'Assumption Day'},
        {date: utcDate(2018, 11, 1), name: 'All Saints Day'},
        {date: utcDate(2018, 11, 11), name: 'Armistice Day'},
        {date: utcDate(2018, 12, 25), name: 'Christmas Day'},
      ]);
    });

  });
  describe('#getBoxingDays', () => {
    it("should turn Saturday holidays in Friday", () => {
      // Turn January 10th 2015 in January 9th 2015.
      var holidays = [{date: utcDate(2015, 1, 10), name: "A Saturday"}];
      expect(getBoxingDays(2015, holidays)).eql([
        {date: utcDate(2015, 1, 9), name: "A Saturday (observed)"}
      ]);
    });

    it("should turn Sunday holidays in Monday", () => {
      // Turn January 11th 2015 in January 12th 2015.
      var holidays = [{date: utcDate(2015, 1, 11), name: "A Sunday"}];
      expect(getBoxingDays(2015, holidays)).eql([
        {date: utcDate(2015, 1, 12), name: "A Sunday (observed)"}
      ]);
    });

    it("should turn January 1st in a Saturday as a Friday of the previous year.", () => {
      // Turn January 1th 2011 in December 31st 2010.
      var holidays = [];
      var boxing = getBoxingDays(2010, holidays);
      expect(boxing).eql([
        {date: utcDate(2010, 12, 31), name: "New Years Day (observed)"}
      ]);
    });

    it("should return all boxing days of 2017.", () => {
      var holidays = getFrenchBankHolidays(2017);
      var boxing = getBoxingDays(2017, holidays);
      expect(boxing).eql([
        {date: utcDate(2017, 1, 2), name: 'New Years Day (observed)'},
        {date: utcDate(2017, 11, 10), name: 'Armistice Day (observed)'},
      ]);
    });

    it("should return all boxing days of 2018.", () => {
      var holidays = getFrenchBankHolidays(2018);
      var boxing = getBoxingDays(2018, holidays);
      expect(boxing).eql([
        {date: utcDate(2018, 7, 13), name: 'Bastille Day (observed)'},
        {date: utcDate(2018, 11, 12), name: 'Armistice Day (observed)'},
      ]);
    });
  });
});
