/*jshint esnext: true */
/* global cloneInto */

browser.runtime.onMessage.addListener(
  holidays => {
    var event = new CustomEvent('show-holidays', {
      detail: holidays,
      bubbles: true
    });
    document.documentElement.dispatchEvent(event);
  }
);
