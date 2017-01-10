var expect = require('chai').expect;
var Utils = require('../src/data/utils.js').Utils;

describe("Utils", () => {
  it("should import.", () => {
    expect(Utils).to.be.a("object");
  });

  describe('#guessTypeFromComment', () => {
    it("should return CP for an empty comment.", () => {
      var type = Utils.guessTypeFromComment("");
      expect(type).eql("CP");
    });

    it("should return CP by default.", () => {
      var type = Utils.guessTypeFromComment("Sailing of the Britany coast.");
      expect(type).eql("CP");
    });

    it("should return CP for a comment containing CP.", () => {
      var type = Utils.guessTypeFromComment("1 CP");
      expect(type).eql("CP");
    });

    it("should return JRTT for a comment containing RTT.", () => {
      var type = Utils.guessTypeFromComment("RTT");
      expect(type).eql("JRTT");
    });

    it("should return CS for a comment containing CSS.", () => {
      var type = Utils.guessTypeFromComment("CSS");
      expect(type).eql("CS");
    });

    it("should return CS for a comment containing sans solde.", () => {
      var type = Utils.guessTypeFromComment("Quelques jours de congés sans solde");
      expect(type).eql("CS");
    });

    it("should return CS for a comment containing wedding.", () => {
      var type = Utils.guessTypeFromComment("Few days off for my wedding.");
      expect(type).eql("CS");
    });

    it("should return CS for a comment containing wedding.", () => {
      var type = Utils.guessTypeFromComment("Few days off for my wedding.");
      expect(type).eql("CS");
    });

    it("should return CS for a comment containing mariage.", () => {
      var type = Utils.guessTypeFromComment("Quelques jours pour mon mariage.");
      expect(type).eql("CS");
    });

    it("should return M for a comment containing M.", () => {
      var type = Utils.guessTypeFromComment("M");
      expect(type).eql("M");
    });

    it("should return M for a comment containing Maladie.", () => {
      var type = Utils.guessTypeFromComment("Maladie");
      expect(type).eql("M");
    });

    it("should return M for a comment containing maladie.", () => {
      var type = Utils.guessTypeFromComment("maladie");
      expect(type).eql("M");
    });

    it("should return M for a comment containing sickness.", () => {
      var type = Utils.guessTypeFromComment("sickness");
      expect(type).eql("M");
    });

    it("should return M for a comment containing pathologique.", () => {
      var type = Utils.guessTypeFromComment("pathologique");
      expect(type).eql("M");
    });

    it("should return M for a comment containing patho.", () => {
      var type = Utils.guessTypeFromComment("patho");
      expect(type).eql("M");
    });
    
    it("should return CS for a comment containing maternité.", () => {
      var type = Utils.guessTypeFromComment("maternité");
      expect(type).eql("CS");
    });

    it("should return CS for a comment containing parental.", () => {
      var type = Utils.guessTypeFromComment("parental");
      expect(type).eql("CS");
    });

    it("should return CS for a comment containing paternité.", () => {
      var type = Utils.guessTypeFromComment("paternité");
      expect(type).eql("CS");
    });

    it("should stop on the first word found..", () => {
      var type = Utils.guessTypeFromComment("Some sickness days before my wedding.");
      expect(type).eql("M");
    });


  });
});
