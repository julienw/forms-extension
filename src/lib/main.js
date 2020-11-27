const { browserAction, tabs } = browser;

var ptoWebsiteUrl = 'https://pto.mozilla.org/mypto.php';

/**
 * This is the entry point for this extension: this registers the event handler
 * for the button.
 */
function init() {
  browserAction.onClicked.addListener(generate);
}

/**
 * This will orchestrate all necessary calls to display the final form in a tab.
 *
 * @returns {Promise<void>}
 */
async function generate() {
  try {
    const tab = await openTabAndAuthenticate(ptoWebsiteUrl);
    const tableDocument = await extractPtoInformationFromTab(tab);

    // Note to a future reader: I tried to reuse this tab to display the result,
    // but this wasn't working at the first try (error "no receiving end" when
    // sending the message) and didn't seem worth the effort to make it work as
    // the current way works fine.
    await tabs.remove(tab.id);

    const holidays = await getAllHolidaysFromDocument(tableDocument);
    await showResults(holidays);
  } catch(e) {
    console.error('Error while generating the holiday form', e);
  }
}

/**
 * Retrieve the PTO table from the tab.
 *
 * @param {Tab} tab This is the tab where we'll get the string from.
 * @returns {Promise<Document>}
 */
async function extractPtoInformationFromTab(tab) {
  const tableHtmlString = await tabs.executeScript(
    tab.id,
    { code: "document.querySelector('table').outerHTML", runAt: "document_end" }
  );
  const parser = new DOMParser();
  return parser.parseFromString(tableHtmlString, 'text/html');
}

/**
 * Parses the document and extract a well-structured object containing the
 * holiday information.
 *
 * @param {ParentNode} Document or element or fragment containing the PTO information we need.
 * @returns {Promise<Array<{start, end, comment}>>}
 */
async function getAllHolidaysFromDocument(tableDocument) {
  // By specifying tbody we avoid the header row.
  var lines = tableDocument.querySelectorAll('tbody > tr');
  var holidays = Array.from(lines).map((line) => {
    var txtStartDate = line.children[1].textContent;
    var txtEndDate = line.children[2].textContent;
    var txtComment = line.children[3].textContent;

    var startDate = new Date(txtStartDate + ' UTC');
    var endDate = new Date(txtEndDate + ' UTC');

    return { start: startDate, end: endDate, comment: txtComment };
  });

  return holidays;
}

/**
 * Opens a pto.mozilla.org page in a tab to trigger authentication. The promise
 * is resolved when the url is finally loaded, after authentication is
 * sucessful. It is rejected if the user closes the tab before authentication.
 *
 * @param {String} url
 * @returns {Promise<Tab>}
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

/**
 * This opens a new tab with the form and hands over the holiday data to it.
 *
 * @param {Array<{start, end, comment}} holidays
 * @returns {Promise<void>}
 */
async function showResults(holidays) {
  const tab = await tabs.create({
    url: '/data/results.html',
  });
  await tabs.executeScript(tab.id, { file: '/data/communication.js' });
  await tabs.sendMessage(tab.id, holidays);
}

init();

