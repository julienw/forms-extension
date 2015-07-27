/*jshint esnext:true */
(function() {

  // width / height
  var ratio = 4;
  var container = document.querySelector('.main-container');
  var cropperPosition;

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
    startImageCropper(img);
  };
  container.appendChild(img);
  container.hidden = false;
}

function createCropperElement({ top, left, width, height }) {
  var div = document.createElement('div');
  div.className = 'cropper-container';
  div.style.left = left + 'px';
  div.style.top = top + 'px';
  div.style.width = width + 'px';
  div.style.height = height + 'px';

  div.innerHTML = `
    <div class='cropper'>
      <div class='cropper-handle cropper-handle-n' data-position='n'></div>
      <div class='cropper-handle cropper-handle-s' data-position='s'></div>
      <div class='cropper-handle cropper-handle-e' data-position='e'></div>
      <div class='cropper-handle cropper-handle-w' data-position='w'></div>
      <div class='cropper-handle cropper-handle-ne' data-position='ne'></div>
      <div class='cropper-handle cropper-handle-se' data-position='se'></div>
      <div class='cropper-handle cropper-handle-nw' data-position='nw'></div>
      <div class='cropper-handle cropper-handle-sw' data-position='sw'></div>
    </div>
  `;

  cropperPosition = {
    top: 30,
    bottom: 100,
    left: 30,
    right: 310,
  };

  var cropper = div.firstElementChild;
  applyCropperPosition(cropper);
  attachCropperHandlers(cropper);
  return div;
}

function setCropperPosition(position, positionChange) {
  var oldWidth = cropperPosition.right - cropperPosition.left;
  var oldHeight = cropperPosition.bottom - cropperPosition.top;
  var width = oldWidth + positionChange.right - positionChange.left;
  var height = oldHeight + positionChange.bottom - positionChange.top;
  
  if (oldWidth === width && oldHeight === height) {
    // case of moving without transforming
    cropperPosition = {
      top: cropperPosition.top + positionChange.top,
      bottom: cropperPosition.bottom + positionChange.bottom,
      left: cropperPosition.left + positionChange.left,
      right: cropperPosition.right + positionChange.right
    };
    return;
  }

  if (oldWidth > oldHeight && (positionChange.left || positionChange.right)) {
    height = Math.round(width / ratio);
  } else if (positionChange.bottom || positionChange.top) {
    width = height * ratio;
  } else if (positionChange.left || positionChange.right) {
    height = Math.round(width / ratio);
  }

  var dimensionChanges = {
    width: width - oldWidth,
    height: height - oldHeight
  };

  positionChange = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  };

  // TODO This needs fixing:
  switch(position.slice(0, 1)) {
    case 'n':
      positionChange.top = -dimensionChanges.height;
      break;
    case 's':
      positionChange.bottom = dimensionChanges.height;
      break;
  }

  switch(position.slice(-1)) {
    case 'e':
      positionChange.right = dimensionChanges.width;
      break;
    case 'w':
      positionChange.left = -dimensionChanges.width;
      break;
  }

  cropperPosition = {
    top: cropperPosition.top + positionChange.top,
    bottom: cropperPosition.bottom + positionChange.bottom,
    left: cropperPosition.left + positionChange.left,
    right: cropperPosition.right + positionChange.right
  };
}

var existingAnimationRequest;
function applyCropperPosition(cropper) {
  cancelAnimationFrame(existingAnimationRequest);
  existingAnimationRequest = requestAnimationFrame(() => {
    var { top, left, right, bottom } = cropperPosition;
    cropper.style.top = top + 'px';
    cropper.style.left = left + 'px';
    cropper.style.width = (right - left) + 'px';
    cropper.style.height = (bottom - top) + 'px';
  });
}

var currentHandle;
function onCropperHandlerStart(e) {
  currentHandle = e.target;
  currentHandle.setCapture(true);
  currentHandle.addEventListener('mousemove', onCropperHandlerMove);
}

function onCropperHandlerMove(e) {
  var positionChange = {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  };

  var target = e.target;
  var position = target.dataset.position || '';

  // use position.includes when it's in a Firefox Stable
  if (position.indexOf('n') !== -1 ||
      target.classList.contains('cropper')) {
    positionChange.top = e.movementY;
  }

  if (position.indexOf('s') !== -1 ||
      target.classList.contains('cropper')) {
    positionChange.bottom = e.movementY;
  }

  if (position.indexOf('w') !== -1 ||
      target.classList.contains('cropper')) {
    positionChange.left = e.movementX;
  }

  if (position.indexOf('e') !== -1 ||
      target.classList.contains('cropper')) {
    positionChange.right = e.movementX;
  }

  setCropperPosition(position, positionChange);
  applyCropperPosition(document.querySelector('.cropper'));
}

function onCropperHandlerEnd(e) {
  currentHandle.removeEventListener('mousemove', onCropperHandlerMove);
  currentHandle = null;
}

function attachCropperHandlers(cropper) {
  cropper.addEventListener('mousedown', onCropperHandlerStart);
  cropper.addEventListener('mouseup', onCropperHandlerEnd);
}

function startImageCropper(img) {
  var rect = img.getBoundingClientRect();
  var cropper = createCropperElement(rect);
  document.body.appendChild(cropper);
}

var button = document.querySelector('.import-button');
button.addEventListener('click', () => {
  var input = createInputFile({ accept: 'image/*' });
  onChange(input).then(() => handleImport(input.files[0]));
  input.click();
});

})();
