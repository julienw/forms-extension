/*jshint esnext: true */
(function(exports) {

var Utils = exports.Utils = {
  throttle(func, delay) {
    var timeout;

    return function(...args) {
      if (!timeout) {
        timeout = setTimeout(() => {
          timeout = null;
          func.apply(this, args);
        }, delay);
      }
    };
  }
};
})(typeof window === 'object' ? window : exports);
