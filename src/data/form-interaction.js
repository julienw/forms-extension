/*jshint esnext:true */
(function() {

'use strict';
var table = document.querySelector('.worked-days-table');

attachHighlightHandlers();
attachUnlinkHandlers();
attachDisplayedHandler();
attachInputHandler();
attachEmptyCellHandler();

function attachInputHandler() {
  table.addEventListener('input', onInput);
  table.addEventListener('input', Utils.throttle(onThrottledInput.bind(null, updateModel), 2000));
}

function attachHighlightHandlers() {
  table.addEventListener('mouseover', (e) => {
    var td;
    if ((td = e.target.closest('td'))) {
      highlightHolidayFromCell(td);
    }
  });

  table.addEventListener('mouseout', (e) => {
    if (e.target.closest('td')) {
      removeAllHighlights();
    }
  });
}

function attachDisplayedHandler() {
  window.addEventListener('table-displayed', function onTableDisplayed() {
    window.removeEventListener('table-displayed', onTableDisplayed);

    buildModel();
  });
}

function attachUnlinkHandlers() {
  table.addEventListener('click', (e) => {
    if (e.target.matches('.unlink-button')) {
      e.stopImmediatePropagation();
      e.preventDefault();
      handleUnlink(e.target.closest('td'));
    }
  });
}

function attachEmptyCellHandler() {
  table.addEventListener('click', (e) => {
    if (e.target.isContentEditable) {
      return;
    }

    var target = e.target.closest('.holiday-cell');
    if (!target) {
      return;
    }
    var content = target.querySelector('[contenteditable]');
    content.focus();
    window.getSelection().selectAllChildren(content);
  });
}

function getHolidayIndexFromDataset(cell) {
  var holidayIdx = cell.dataset.holidayIndex;
  if (!holidayIdx) {
    return null;
  }

  holidayIdx = +holidayIdx;
  if (holidayIdx < 0) {
    return null;
  }

  return holidayIdx;
}

function recalculateTotal() {
  Array.from(table.querySelectorAll('tr')).forEach(tr => {
    var totalCell = tr.querySelector('.total');
    if (!totalCell) {
      return;
    }
    var editableCells = tr.querySelectorAll('td [contenteditable="true"]');
    var total = Array.from(editableCells).reduce((result, cell) => {
      var content = cell.textContent.trim();
      var shouldCount = content && content !== 'JF';
      if (shouldCount) {
        var diff = (content.indexOf('.5') === -1) ? 1 : 0.5;
        return result + diff;
      }
      return result;
    }, 0);
    totalCell.textContent = total;
  });
}

var model;
function buildModel() {
  model = [];
  Array.from(table.querySelectorAll('[data-holiday-index]')).forEach(cell => {
    var holidayIdx = getHolidayIndexFromDataset(cell);
    if (holidayIdx === null) {
      return;
    }

    var holiday = model[holidayIdx] = model[holidayIdx] || {
      cells: [],
      linked: true
    };
    holiday.cells.push(cell);
  });
}

function handleUnlink(cell) {
  var holidayIdx = getHolidayIndexFromDataset(cell);
  if (holidayIdx === null) {
    return;
  }

  var holiday = model[holidayIdx];
  holiday.linked = !holiday.linked;
  holiday.cells.forEach(
    cell => cell.classList.toggle('cell-unlinked', !holiday.linked)
  );

  if (holiday.linked) {
    mirrorHolidayValue(cell);
    highlightHolidayFromCell(cell);
    recalculateTotal();
  } else {
    removeAllHighlights();
  }
}

function highlightHolidayFromCell(cell) {
  var holidayIdx = getHolidayIndexFromDataset(cell);
  if (holidayIdx === null) {
    return;
  }

  var holiday = model[holidayIdx];
  if (holiday.linked) {
    holiday.cells.forEach(cell => cell.classList.add('cell-highlight'));
  }
}

function removeAllHighlights() {
  Array.from(table.querySelectorAll('.cell-highlight')).forEach(
    (cell) => cell.classList.remove('cell-highlight')
  );
}

function onInput(e) {
  if (e.target.isContentEditable) {
    e.target.classList.toggle('has-content', e.target.textContent.trim());
  }
}

function onThrottledInput(callback, e) {
  if (e.target.isContentEditable) {
    mirrorHolidayValue(e.target.closest('td'), callback);
  }
}

function mirrorHolidayValue(cell, callback) {
  var input = cell.querySelector('[contenteditable="true"]')
  var weekId = input.dataset.week;
  var dayId = input.dataset.day;
  var value = input.textContent.trim();
  callback(weekId, dayId, value.trim());
}

})();
