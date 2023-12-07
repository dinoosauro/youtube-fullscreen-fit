let check = { // Key: checkbox ID, Value: the property to change in the storage
    "autoCover": "AutoApply",
    "stretch": "IsStretched"
}
for (let item in check) {
    document.getElementById(item).onchange = () => { // If checked, write 1 to the storage. Otherwise, write 0.
        (chrome ?? "") !== "" ? chrome.storage.sync.set({[check[item]]: document.getElementById(item).checked ? "1" : "0"}) : browser.storage.sync.set({[check[item]]: document.getElementById(item).checked ? "1" : "0"});
    }
    (chrome ?? "") !== "" ? chrome.storage.sync.get([check[item]], (res) => {document.getElementById(item).checked = res[check[item]] !== "0"}) : chrome.storage.sync.get([check[item]]).then((res) => {document.getElementById(item).checked = res[check[item]] !== "0"}); // Get the value of that item and update the DOM
}
