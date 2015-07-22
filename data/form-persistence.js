/*jshint esnext: true */
(function() {
'use strict';

var ptoForm = document.querySelector('.pto-form');

restoreSavedValues();
attachInputHandler();

function attachInputHandler() {
  ptoForm.addEventListener('input', Utils.throttle(onInput, 500));
}

function onInput(e) {
  var input = e.target;
  var persistKey = input.dataset.persist;
  if (persistKey) {
    var value = e.target.textContent;
    persist(persistKey, value);
    displaySavedValue(persistKey, value, e.target);
  }
}

function persist(key, value) {
  asyncStorage.setItem(key, value);
}

function restoreSavedValues() {
  asyncStorage.length((l) => {
    for (var i = 0; i < l; i++) {
      asyncStorage.key(i, (persistKey) => {
        asyncStorage.getItem(persistKey, (value) => {
          displaySavedValue(persistKey, value);
        });
      });
    }
  });
}

/**
 * @param {String} persistKey
 * @param {String} value
 * @param {Node} [excluded]
 */
function displaySavedValue(persistKey, value, excluded) {
  var elements = document.querySelectorAll(`[data-persist=${persistKey}]`);
  Array.from(elements).forEach(elt => {
    if (elt !== excluded) {
      elt.textContent = value;
    }
  });
}

})();
