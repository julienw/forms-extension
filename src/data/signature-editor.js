/*jshint esnext: true */

(function() {
'use strict';

var editor = document.querySelector('.signature-editor');
var canvas = document.querySelector('.signature-canvas');
var persistKey;

attachTriggeringListeners();
attachDrawingListeners();
attachControlsListeners();
attachKeyboardListeners();

function attachTriggeringListeners() {
  var signatures = Array.from(document.querySelectorAll('.signature'));
  signatures.forEach(elt => {
    elt.addEventListener('click', enterEditor);
  });
}

function attachDrawingListeners() {
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mouseup', endDrawing);
}

function attachControlsListeners() {
  var clearButton = document.querySelector('.signature-editor-clear-button');
  var finishButton = document.querySelector('.signature-editor-finish-button');
  var cancelButton = document.querySelector('.signature-editor-cancel-button');

  clearButton.addEventListener('click', clearEditor);

  finishButton.addEventListener('click', finishAndExit);

  cancelButton.addEventListener('click', exitEditor);
  editor.addEventListener('click', (e) => {
    if (e.target === editor) {
      finishAndExit();
    }
  });
}

function finishAndExit() {
  canvas.toBlob(blob => {
    var event = new CustomEvent(
      'persist-value', { detail: { blob, persistKey } }
    );
    window.dispatchEvent(event);
    exitEditor();
  });
}

function attachKeyboardListeners() {
  window.addEventListener('keydown', onKey);
}

function onKey(e) {
  if (e.key === 'Escape') {
    exitEditor();
  }
}

// function detachKeyboardListeners() {
//   window.removeEventListener('keydown', onKey);
// }

function enterEditor(e) {
  persistKey = e.target.dataset.persist;
  var existingData = e.target.dataset.blobUrl;
  if (existingData) {
    drawImage(existingData);
  }
  editor.hidden = false;
  editor.focus();
}

function drawImage(url) {
  var img = new Image();
  img.src = url;
  img.onload = function() {
    var ctx = canvas.getContext('2d');
    ctx.drawImage(this, 0, 0);
  };
}

function exitEditor() {
  clearEditor();
  persistKey = null;
  editor.hidden = true;
}

function clearEditor() {
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

var ctx;
function startDrawing(e) {
  canvas.setCapture(true);
  canvas.addEventListener('mousemove', drawLine);
  ctx = canvas.getContext('2d');
  ctx.lineWidth = 2;
  ctx.lineCap = 'round'; // otherwise simple points are not drawn
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}

function endDrawing(e) {
  canvas.removeEventListener('mousemove', drawLine);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  ctx = null;
}

function drawLine(e) {
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
}


})();
