/*jshint esnext: true */
/* global cloneInto */

self.port.on(
  'show', (holidays) => {
    var event = new CustomEvent('show-holidays', {
      detail: cloneInto(holidays, document.defaultView),
      bubbles: true
    });
    document.documentElement.dispatchEvent(event);
  }
);
