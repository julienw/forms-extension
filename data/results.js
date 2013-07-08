self.port.on('show', show);

function show(week) {
  week.holidayWeek = getHolidayWeek(week);
  displayWeek(week);
}

function getHolidayWeek(week) {
  var holidayWeek = [];
  var curDate = new Date(+week.start);
  var firstDay = curDate.getDate();
  for (var i = 0; i < 5; i++) {
    curDate.setDate(firstDay + i);
    holidayWeek = week.holidayStart <= curDate && curDate <= week.holidayEnd;
  }
  return holidayWeek;
}

function holidayWeek(week) {
  var output = document.createElement('ul');
  output.id = 'output';
  for (var id in holidays) {
    var holiday = holidays[id];
    var li = document.createElement('li');
    li.textContent = JSON.stringify(holiday);
    output.appendChild(li);
  }
  document.body.appendChild(output);
}

// taken from the gaia sms app
var rdashes = /-(.)/g;
function camelCase(str) {
  return str.replace(rdashes, function replacer(str, p1) {
    return p1.toUpperCase();
  });
}

