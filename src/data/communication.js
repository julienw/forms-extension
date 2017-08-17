/*jshint esnext: true */

browser.runtime.onMessage.addListener(
  holidays => {
    var event = new CustomEvent('show-holidays', {
      detail: holidays,
      bubbles: true
    });
    document.documentElement.dispatchEvent(event);
  }
);
