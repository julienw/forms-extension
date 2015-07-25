/*jshint esnext: true */
(function() {
'use strict';

var ptoForm = document.querySelector('.pto-form');

restoreSavedValues();
attachInputHandler();
attachPersistHandler();

function attachInputHandler() {
  ptoForm.addEventListener('input', Utils.throttle(onInput, 500));
}

function attachPersistHandler() {
  window.addEventListener('persist-value', (e) => {
    var { persistKey, blob, width, height } = e.detail;
    persist(persistKey, blob);
    displaySavedValue(persistKey, blob);
  });
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

var displayValue = {
  simple: (elt, value) => elt.textContent = value,
  image: (elt, blob) => {
    var oldBlobUrl = elt.dataset.blobUrl;
    if (oldBlobUrl) {
      window.URL.revokeObjectURL(oldBlobUrl);
    }

    var blobUrl = window.URL.createObjectURL(blob);
    elt.style.backgroundImage = `url(${blobUrl})`;
    elt.dataset.blobUrl = blobUrl;
  }
};

/**
 * @param {String} persistKey
 * @param {String} value
 * @param {Node} [excluded]
 */
function displaySavedValue(persistKey, value, excluded) {
  var elements = document.querySelectorAll(`[data-persist=${persistKey}]`);
  Array.from(elements).forEach(elt => {
    if (elt !== excluded) {
      var type = elt.dataset.persistType || 'simple';
      displayValue[type](elt, value);
    }
  });
}

})();
