/*jshint esnext:true */
(function() {

'use strict';
var table = document.querySelector('.worked-days-table');

attachInputHandler();
attachEmptyCellHandler();

function attachInputHandler() {
  table.addEventListener('input', Utils.throttle(onThrottledInput.bind(null, updateModel), 2000));
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

function onThrottledInput(callback, e) {
  if (e.target.isContentEditable) {
    mirrorHolidayValue(e.target.closest('td'), callback);
  }
}

function mirrorHolidayValue(cell, callback) {
  var input = cell.querySelector('[contenteditable="true"]')
  var weekId = parseInt(input.dataset.week, 10);
  var dayId = parseInt(input.dataset.day, 10);
  var value = input.textContent.trim();
  callback(weekId, dayId, value);
}

})();
