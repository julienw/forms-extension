var fakeData = [[{"start":"2015-08-31T00:00:00.000Z","end":"2015-09-04T00:00:00.000Z","holidayStart":"2015-09-02T00:00:00.000Z","holidayEnd":"2015-09-04T00:00:00.000Z"},{"start":"2015-09-07T00:00:00.000Z","end":"2015-09-11T00:00:00.000Z","holidayStart":"2015-09-07T00:00:00.000Z","holidayEnd":"2015-09-09T00:00:00.000Z"}],[{"start":"2015-06-15T00:00:00.000Z","end":"2015-06-19T00:00:00.000Z","holidayStart":"2015-06-19T00:00:00.000Z","holidayEnd":"2015-06-19T00:00:00.000Z"},{"start":"2015-06-22T00:00:00.000Z","end":"2015-06-26T00:00:00.000Z","holidayStart":"2015-06-22T00:00:00.000Z","holidayEnd":"2015-06-22T00:00:00.000Z"}],[{"start":"2015-05-25T00:00:00.000Z","end":"2015-05-29T00:00:00.000Z","holidayStart":"2015-05-25T00:00:00.000Z","holidayEnd":"2015-05-25T00:00:00.000Z"}],[{"start":"2015-05-11T00:00:00.000Z","end":"2015-05-15T00:00:00.000Z","holidayStart":"2015-05-11T00:00:00.000Z","holidayEnd":"2015-05-15T00:00:00.000Z"}],[{"start":"2015-04-27T00:00:00.000Z","end":"2015-05-01T00:00:00.000Z","holidayStart":"2015-04-27T00:00:00.000Z","holidayEnd":"2015-04-27T00:00:00.000Z"}],[{"start":"2015-03-09T00:00:00.000Z","end":"2015-03-13T00:00:00.000Z","holidayStart":"2015-03-09T00:00:00.000Z","holidayEnd":"2015-03-13T00:00:00.000Z"}],[{"start":"2014-12-29T00:00:00.000Z","end":"2015-01-02T00:00:00.000Z","holidayStart":"2015-01-02T00:00:00.000Z","holidayEnd":"2015-01-02T00:00:00.000Z"}],[{"start":"2014-12-22T00:00:00.000Z","end":"2014-12-26T00:00:00.000Z","holidayStart":"2014-12-26T00:00:00.000Z","holidayEnd":"2014-12-26T00:00:00.000Z"},{"start":"2014-12-29T00:00:00.000Z","end":"2015-01-02T00:00:00.000Z","holidayStart":"2014-12-29T00:00:00.000Z","holidayEnd":"2014-12-29T00:00:00.000Z"}],[{"start":"2014-11-24T00:00:00.000Z","end":"2014-11-28T00:00:00.000Z","holidayStart":"2014-11-26T00:00:00.000Z","holidayEnd":"2014-11-28T00:00:00.000Z"}],[{"start":"2014-09-29T00:00:00.000Z","end":"2014-10-03T00:00:00.000Z","holidayStart":"2014-10-02T00:00:00.000Z","holidayEnd":"2014-10-03T00:00:00.000Z"},{"start":"2014-10-06T00:00:00.000Z","end":"2014-10-10T00:00:00.000Z","holidayStart":"2014-10-06T00:00:00.000Z","holidayEnd":"2014-10-06T00:00:00.000Z"}],[{"start":"2014-08-18T00:00:00.000Z","end":"2014-08-22T00:00:00.000Z","holidayStart":"2014-08-20T00:00:00.000Z","holidayEnd":"2014-08-22T00:00:00.000Z"},{"start":"2014-08-25T00:00:00.000Z","end":"2014-08-29T00:00:00.000Z","holidayStart":"2014-08-25T00:00:00.000Z","holidayEnd":"2014-08-29T00:00:00.000Z"},{"start":"2014-09-01T00:00:00.000Z","end":"2014-09-05T00:00:00.000Z","holidayStart":"2014-09-01T00:00:00.000Z","holidayEnd":"2014-09-05T00:00:00.000Z"},{"start":"2014-09-08T00:00:00.000Z","end":"2014-09-12T00:00:00.000Z","holidayStart":"2014-09-08T00:00:00.000Z","holidayEnd":"2014-09-12T00:00:00.000Z"}],[{"start":"2014-07-14T00:00:00.000Z","end":"2014-07-18T00:00:00.000Z","holidayStart":"2014-07-18T00:00:00.000Z","holidayEnd":"2014-07-18T00:00:00.000Z"}],[{"start":"2014-06-23T00:00:00.000Z","end":"2014-06-27T00:00:00.000Z","holidayStart":"2014-06-23T00:00:00.000Z","holidayEnd":"2014-06-27T00:00:00.000Z"}],[{"start":"2014-05-26T00:00:00.000Z","end":"2014-05-30T00:00:00.000Z","holidayStart":"2014-05-30T00:00:00.000Z","holidayEnd":"2014-05-30T00:00:00.000Z"}],[{"start":"2014-04-28T00:00:00.000Z","end":"2014-05-02T00:00:00.000Z","holidayStart":"2014-05-02T00:00:00.000Z","holidayEnd":"2014-05-02T00:00:00.000Z"}],[{"start":"2014-04-14T00:00:00.000Z","end":"2014-04-18T00:00:00.000Z","holidayStart":"2014-04-14T00:00:00.000Z","holidayEnd":"2014-04-14T00:00:00.000Z"}],[{"start":"2014-03-17T00:00:00.000Z","end":"2014-03-21T00:00:00.000Z","holidayStart":"2014-03-17T00:00:00.000Z","holidayEnd":"2014-03-21T00:00:00.000Z"}],[{"start":"2014-03-10T00:00:00.000Z","end":"2014-03-14T00:00:00.000Z","holidayStart":"2014-03-14T00:00:00.000Z","holidayEnd":"2014-03-14T00:00:00.000Z"}],[{"start":"2014-02-10T00:00:00.000Z","end":"2014-02-14T00:00:00.000Z","holidayStart":"2014-02-14T00:00:00.000Z","holidayEnd":"2014-02-14T00:00:00.000Z"}],[{"start":"2013-12-30T00:00:00.000Z","end":"2014-01-03T00:00:00.000Z","holidayStart":"2014-01-02T00:00:00.000Z","holidayEnd":"2014-01-02T00:00:00.000Z"}],[{"start":"2013-09-30T00:00:00.000Z","end":"2013-10-04T00:00:00.000Z","holidayStart":"2013-10-02T00:00:00.000Z","holidayEnd":"2013-10-02T00:00:00.000Z"}],[{"start":"2013-08-12T00:00:00.000Z","end":"2013-08-16T00:00:00.000Z","holidayStart":"2013-08-16T00:00:00.000Z","holidayEnd":"2013-08-16T00:00:00.000Z"}],[{"start":"2013-07-15T00:00:00.000Z","end":"2013-07-19T00:00:00.000Z","holidayStart":"2013-07-16T00:00:00.000Z","holidayEnd":"2013-07-19T00:00:00.000Z"},{"start":"2013-07-22T00:00:00.000Z","end":"2013-07-26T00:00:00.000Z","holidayStart":"2013-07-22T00:00:00.000Z","holidayEnd":"2013-07-25T00:00:00.000Z"}],[{"start":"2013-05-27T00:00:00.000Z","end":"2013-05-31T00:00:00.000Z","holidayStart":"2013-05-31T00:00:00.000Z","holidayEnd":"2013-05-31T00:00:00.000Z"},{"start":"2013-06-03T00:00:00.000Z","end":"2013-06-07T00:00:00.000Z","holidayStart":"2013-06-03T00:00:00.000Z","holidayEnd":"2013-06-07T00:00:00.000Z"},{"start":"2013-06-10T00:00:00.000Z","end":"2013-06-14T00:00:00.000Z","holidayStart":"2013-06-10T00:00:00.000Z","holidayEnd":"2013-06-10T00:00:00.000Z"}],[{"start":"2013-05-06T00:00:00.000Z","end":"2013-05-10T00:00:00.000Z","holidayStart":"2013-05-10T00:00:00.000Z","holidayEnd":"2013-05-10T00:00:00.000Z"}],[{"start":"2012-12-24T00:00:00.000Z","end":"2012-12-28T00:00:00.000Z","holidayStart":"2012-12-26T00:00:00.000Z","holidayEnd":"2012-12-27T00:00:00.000Z"}]];
