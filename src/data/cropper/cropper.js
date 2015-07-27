/*jshint esnext:true */
(function(exports) {

// width / height
var ratio = null;
var cropperPosition;
var cropperContainer;

function createCropperElement() {
  var div = document.createElement('div');
  div.className = 'cropper-container';
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

function startImageCropper(img, aRatio) {
  ratio = aRatio;
  if (!cropperContainer) {
    cropperContainer = createCropperElement();
    document.body.appendChild(cropperContainer);
  }

  var { left, top, width, height } = img.getBoundingClientRect();
  cropperContainer.style.left = left + 'px';
  cropperContainer.style.top = top + 'px';
  cropperContainer.style.width = width + 'px';
  cropperContainer.style.height = height + 'px';
}

function closeCropper() {
  cropperContainer.remove();
  cropperContainer = null;
}

exports.Cropper = {
  start: startImageCropper,
  getPosition: () => cropperPosition,
  close: closeCropper
};
})(window);
