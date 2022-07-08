window.addEventListener('DOMContentLoaded', (e) => {
  let exploreSelectedButton = document.getElementById("exploreSelectedEndpoint");
  let exploreCurrentButton = document.getElementById("exploreCurrentEndpoint");
  let endpointURLInput = document.getElementById("endpointInput");

  exploreSelectedButton.addEventListener("click", async () => {
    let selectedURL = endpointURLInput.value;
    console.log("Selected SPARQL endpoint: " + selectedURL);
    // TODO: replace with selected URL
    openPreviewTab("https://data.gov.cz/sparql")
  });

  exploreCurrentButton.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    openPreviewTab(tab.url)
  });
})


function openPreviewTab(endpointURL) {
  console.log('Opening new tab! Selected endpoint: ' + endpointURL);
  chrome.runtime.sendMessage({action: 'tab', endpoint: endpointURL});
}
