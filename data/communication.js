/*jshint esnext: true */

self.port.on(
  'show', (holidays) => unsafeWindow.generateForm(cloneInto(holidays, unsafeWindow))
);

