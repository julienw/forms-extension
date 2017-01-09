var expect = require('chai').expect;
var fbh = require('../src/data/french-bank-holidays.js');

describe("French Bank Holidays", () => {
  it("should import.", () => {
    expect(fbh).to.be.a("object");
  });

  describe('#getFrenchBankHolidays', () => {
    it("should return 2016 holidays", () => {
      var holidays2016 = fbh.getFrenchBankHolidays(2016);
      expect(holidays2016).eql([
        [1, 1, 'New Years Day'],
        [3, 28, 'Easter monday'],
        [5, 1, 'Labour Day'],
        [5, 5, 'Ascension Thursday'],
        [5, 8, 'Victory in Europe Day'],
        [7, 14, 'Bastille Day'],
        [8, 15, 'Assumption Day'],
        [11, 1, 'All Saints Day'],
        [11, 11, 'Armistice Day'],
        [12, 25, 'Christmas Day'],
      ]);
    });

    it("should return 2017 holidays", () => {
      var holidays2017 = fbh.getFrenchBankHolidays(2017);
      expect(holidays2017).eql([
        [1, 1, 'New Years Day'],
        [4, 17, 'Easter monday'],
        [5, 1, 'Labour Day'],
        [5, 8, 'Victory in Europe Day'],
        [5, 25, 'Ascension Thursday'],
        [7, 14, 'Bastille Day'],
        [8, 15, 'Assumption Day'],
        [11, 1, 'All Saints Day'],
        [11, 11, 'Armistice Day'],
        [12, 25, 'Christmas Day'],
      ]);
    });

    it("should return 2018 holidays", () => {
      var holidays2018 = fbh.getFrenchBankHolidays(2018);
      expect(holidays2018).eql([
        [1, 1, 'New Years Day'],
        [4, 2, 'Easter monday'],
        [5, 1, 'Labour Day'],
        [5, 8, 'Victory in Europe Day'],
        [5, 10, 'Ascension Thursday'],
        [7, 14, 'Bastille Day'],
        [8, 15, 'Assumption Day'],
        [11, 1, 'All Saints Day'],
        [11, 11, 'Armistice Day'],
        [12, 25, 'Christmas Day'],
      ]);
    });

    describe('#getBoxingDays', () => {
      it("should turn Saturday holidays in Friday", () => {
        // Turn January 10th 2015 in January 9th 2015.
        var holidays = [[1, 10, 'A Saturday']];
        var boxing = fbh.getBoxingDays(2015, holidays);
        expect(boxing).eql([
          [1, 9, 'A Saturday (observed)']
        ]);
      });

      it("should turn Sunday holidays in Monday", () => {
        // Turn January 11th 2015 in January 12th 2015.
        var holidays = [[1, 11, 'A Sunday']];
        var boxing = fbh.getBoxingDays(2015, holidays);
        expect(boxing).eql([
          [1, 12, 'A Sunday (observed)']
        ]);
      });

      it("should turn January 1st in a Saturday as a Friday of the previous year.", () => {
        // Turn January 1th 2011 in December 31st 2010.
        var holidays = [];
        var boxing = fbh.getBoxingDays(2010, holidays);
        expect(boxing).eql([
          [12, 31, 'New Years Day (observed)']
        ]);
      });

      it("should return all boxing days of 2017.", () => {
        var holidays = fbh.getFrenchBankHolidays(2017);
        var boxing = fbh.getBoxingDays(2017, holidays);
        expect(boxing).eql([
          [1, 2, 'New Years Day (observed)'],
          [11, 10, 'Armistice Day (observed)'],
        ]);
      });

    });
  });
});
