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
async function getDocumentAtUrl(url) {
  const response = await fetch(url, {
    mode: 'same-origin',
    credentials: 'same-origin',
    redirect: 'manual',
  });

  if (response.ok) {
    const page = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(page, 'text/html');
  }

  if (response.type === 'opaqueredirect') {
    // Needs authentication
    await authenticate(url);
    return getDocumentAtUrl(url);
  }

  throw new Error('Unknown error while fetching PTOs, your Firefox config prevent the add-on from accessing the auth0 pto cookie, try resetting your `privacy.firstparty.isolate` setting, remove all existing auth0 and pto cookies and try again.');
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
  const tab = await tabs.create({ url });

  // Note: tab.status is invalid right now, we need to wait for a first
  // onUpdated callback to get it right.
  // See https://bugzilla.mozilla.org/show_bug.cgi?id=1381756

  await new Promise((resolve, reject) => {
    function removedListener(id) {
      if (id !== tab.id) {
        return;
      }
      tabs.onRemoved.removeListener(removedListener);
      tabs.onUpdated.removeListener(updatedListener);
      reject(new Error('User closed the authentication tab.'));
    }

    function updatedListener(id, _, updatedTab) {
      if (id !== tab.id) {
        return;
      }

      if (updatedTab.url === url) {
        tabs.onRemoved.removeListener(removedListener);
        tabs.onUpdated.removeListener(updatedListener);
        resolve();
      }
    }

    tabs.onRemoved.addListener(removedListener);
    tabs.onUpdated.addListener(updatedListener);
  });

  await tabs.remove(tab.id);
}

async function showResults(holidays) {
  const tab = await tabs.create({
    url: '/data/results.html',
  });
  await tabs.executeScript(tab.id, { file: '/data/communication.js' });
  await tabs.sendMessage(tab.id, holidays);
}

init();

