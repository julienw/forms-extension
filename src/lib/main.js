const { browserAction, tabs } = browser;

var ptoWebsiteUrl = 'https://pto.mozilla.org/mypto.php';

function init() {
  browserAction.onClicked.addListener(generate);
}

async function generate() {
  try {
    const holidays = await getAllHolidays(ptoWebsiteUrl);
    await showResults(holidays);
  } catch(e) {
    console.error('Error while handling holidays', e);
  }
}

/**
 * Retrieve a document at this url, handling authentication in the process.
 *
 * @returns {Promise.<Document>}
 */
function getDocumentAtUrl(url) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'document';
    xhr.withCredentials = true;
    xhr.onload = function() {
      if (isAuthenticationNeeded(xhr)) {
        resolve(authenticate(url).then(() => getDocumentAtUrl(url)));
        return;
      }

      resolve(xhr.responseXML);
    };

    xhr.onerror = () => reject(new Error('Network Error'));

    xhr.send();
  });
}

function isAuthenticationNeeded(xhr) {
  return (xhr.status === 401);
}

/**
 * Retrieve the mypto page and parses it to a JS object
 *
 * @returns {Promise.<Array.<{start, end, comment}>>}
 */
function getAllHolidays(url) {
  return getDocumentAtUrl(url).then(document => {
    var lines = document.querySelectorAll('tbody > tr');
    var holidays = Array.from(lines).map((line) => {
      var txtHours = parseInt(line.children[1].textContent, 10);
      var txtStartDate = line.children[2].textContent;
      var txtEndDate = line.children[3].textContent;
      var txtComment = line.children[4].textContent;

      var startDate = new Date(txtStartDate + ' UTC');
      var endDate = new Date(txtEndDate + ' UTC');

      return { start: startDate, end: endDate, comment: txtComment, hours: txtHours };
    });

    return holidays;
  }).catch(e => {
    console.error('got error while retrieving document:', e);
    throw e;
  });
}

/**
 * Opens a pto.mozilla.org page in a tab to trigger authentication.
 *
 * @returns Promise
 */
async function authenticate(url) {
  const tab = await tabs.create({
    url,
    active: false,
  });

  // Note: tab.status is invalid right now, we need to wait for a first
  // onUpdated callback to get it right.
  // See https://bugzilla.mozilla.org/show_bug.cgi?id=1381756

  const title = await new Promise(resolve => {
    tabs.onUpdated.addListener(function listener(id, _, updatedTab) {
      if (id !== tab.id) {
        return;
      }

      // TODO We can't easily know when the tab is at the "interactive" state as
      // we used to know with the old SDK APIs. Maybe we should execute a script
      // to know this.
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1381754
      if (updatedTab.status === 'complete') {
        resolve(updatedTab.title || null);
        tabs.onUpdated.removeListener(listener);
      }
    });
  });

  await tabs.remove(tab.id);

  if (title.startsWith('401')) {
    throw new Error('User canceled authentication');
  }
}

async function showResults(holidays) {
  const tab = await tabs.create({
    url: '/data/results.html',
  });
  await tabs.executeScript(tab.id, { file: '/data/communication.js' });
  await tabs.sendMessage(tab.id, holidays);
}

init();

