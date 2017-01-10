/*jshint esnext: true */
(function(exports) {

  function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
      // Make sure the first letter of each word is Upper Case.
      return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
  };

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
  },

  guessTypeFromComment(comment) {
    var KNOWN_TYPES = ['RTT', 'CP', 'CS', 'M'];
    var words = {'sickness': 'M', 'maladie': 'M', 'patho': 'M',
                 'wedding': 'CS', 'mariage': 'CS',
                 'maternité': 'CS', 'parental': 'CS', 'paternité': 'CS',
                 'sans solde': 'CS'};
    var type = KNOWN_TYPES.find(type => comment && toTitleCase(comment).includes(type));
    if (type == 'RTT') type = 'JRTT';
    Object.keys(words).some(word => {
      if (comment && comment.toLowerCase().includes(word)) {
        type = words[word];
        return true;
      }
      return false;
    });
    return type || 'CP';
  }

};
})(typeof window === 'object' ? window : exports);
