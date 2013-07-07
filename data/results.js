self.port.on('show', show);

function show(holidays) {
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

