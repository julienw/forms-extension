var main = require('./main');

exports['test showHoliday - start and end in working week'] = function(assert) {
  var input = {
    id: '11872',
    start: new Date('2013-05-31T00:00:00.000Z'),
    end: new Date('2013-06-10T00:00:00.000Z'),
    firstName: 'Julien',
    lastName: 'Wajsberg'
  };

  var weeks = main.showHoliday(input);

  assert.equal(weeks.length, 3);
};

exports['test showHoliday - start is sunday'] = function(assert) {
  var input = {
    id: '11872',
    start: new Date('2013-05-26T00:00:00.000Z'),
    end: new Date('2013-06-10T00:00:00.000Z'),
    firstName: 'Julien',
    lastName: 'Wajsberg'
  };

  var weeks = main.showHoliday(input);

  assert.equal(weeks.length, 3);
};

exports['test showHoliday - start is saturday'] = function(assert) {
  var input = {
    id: '11872',
    start: new Date('2013-05-25T00:00:00.000Z'),
    end: new Date('2013-06-10T00:00:00.000Z'),
    firstName: 'Julien',
    lastName: 'Wajsberg'
  };

  var weeks = main.showHoliday(input);

  assert.equal(weeks.length, 3);
};

exports['test showHoliday - end is saturday'] = function(assert) {
  var input = {
    id: '11872',
    start: new Date('2013-05-31T00:00:00.000Z'),
    end: new Date('2013-06-15T00:00:00.000Z'),
    firstName: 'Julien',
    lastName: 'Wajsberg'
  };

  var weeks = main.showHoliday(input);

  assert.equal(weeks.length, 3);
};

exports['test showHoliday - end is sunday'] = function(assert) {
  var input = {
    id: '11872',
    start: new Date('2013-05-31T00:00:00.000Z'),
    end: new Date('2013-06-16T00:00:00.000Z'),
    firstName: 'Julien',
    lastName: 'Wajsberg'
  };

  var weeks = main.showHoliday(input);

  assert.equal(weeks.length, 3);
};

require('sdk/test').run(exports);
