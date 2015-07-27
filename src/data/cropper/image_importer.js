/*jshint esnext:true */
(function(exports) {

  // width / height
  var ratio = 4;
  var container = document.querySelector('.main-container');

  function createInputFile({ accept }) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  return input;
}

function onEvent(elt, eventName) {
  return new Promise(resolve => {
    elt.addEventListener(eventName, function onEvent() {
      elt.removeEventListener(eventName, onEvent);
      resolve();
    });
  });
}

function onChange(elt) { return onEvent(elt, 'change'); }

function handleImport(file) {
  var img = new Image();
  img.src = window.URL.createObjectURL(file);
  img.onload = function() {
    window.URL.revokeObjectURL(img.src);
    Cropper.start(img, ratio);
  };
  container.appendChild(img);
  container.hidden = false;
}

function attach(selector) {
  var button = document.querySelector(selector);
  button.addEventListener('click', () => {
    var input = createInputFile({ accept: 'image/*' });
    onChange(input).then(() => handleImport(input.files[0]));
    input.click();
  });
}

exports.ImageImporter = {
  attach
};

})(window);
