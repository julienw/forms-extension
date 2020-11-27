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
  const tab = await openTabAndAuthenticate(url);
  const tableHtmlString = await tabs.executeScript(
    tab.id,
    { code: "document.querySelector('table').outerHTML", runAt: "document_end" }
  );
  await tabs.remove(tab.id);
  const parser = new DOMParser();
  return parser.parseFromString(tableHtmlString, 'text/html');
}

/**
 * Retrieve the mypto page and parses it to a JS object
 *
 * @returns {Promise.<Array.<{start, end, comment}>>}
 */
function getAllHolidays(url) {
  return getDocumentAtUrl(url).then(document => {
    // By specifying tbody we avoid the header row.
    var lines = document.querySelectorAll('tbody > tr');
    var holidays = Array.from(lines).map((line) => {
      var txtStartDate = line.children[1].textContent;
      var txtEndDate = line.children[2].textContent;
      var txtComment = line.children[3].textContent;

      var startDate = new Date(txtStartDate + ' UTC');
      var endDate = new Date(txtEndDate + ' UTC');

      return { start: startDate, end: endDate, comment: txtComment };
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
 * @returns Promise<Tab>
 */
async function openTabAndAuthenticate(url) {
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

  return tab;
}

async function showResults(holidays) {
  const tab = await tabs.create({
    url: '/data/results.html',
  });
  await tabs.executeScript(tab.id, { file: '/data/communication.js' });
  await tabs.sendMessage(tab.id, holidays);
}

init();

