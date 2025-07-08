/**
 * The Manifest V3 API
 */
const browserToUse = typeof chrome === "undefined" ? browser : chrome;


/**
 * The array that contains all the pressed keys, in lowercase
 */
let combination = [];

document.getElementById("toggleShortcut").addEventListener("click", () => {
    document.getElementById("toggleShortcut").textContent = "";
    /**
     * The event listener that'll be triggered when the user presses a key
     * @param {KeyboardEvent} e the Event
     */
    const event = (e) => {
        e.preventDefault();
        if (combination.indexOf(e.key.toLowerCase()) !== -1) return; // Avoid adding multiple times the same key
        combination.push(e.key.toLowerCase());
        document.getElementById("toggleShortcut").textContent += ` ${e.key.toLowerCase()}`;
    }
    window.addEventListener("keydown", event);
    window.addEventListener("keyup", () => {
        window.removeEventListener("keydown", event); // Remove the previous event listener since it's no longer needed
        updateKeyboardShortcut().then(() => {combination = []});
    })
});

/**
 * Save the new keyboard shortcut for enabling/disabling the extension, and send the new combination to the script.
 */
async function updateKeyboardShortcut() {
    setItem("ToggleExtensionCmd", combination); // Save the new combination
    const ids = await browserToUse.tabs.query({ active: true }); // Send to the content script the new keyboard shortcut
    browserToUse.tabs.sendMessage(ids[0].id, { action: "updateKeyboardShortcut", content: combination });
}

document.getElementById("deleteShortcut").addEventListener("click", () => { // Remove the saved shortcut
    document.getElementById("toggleShortcut").textContent = "";
    combination = [];
    updateKeyboardShortcut();
})

browserToUse.storage.sync.get(["ToggleExtensionCmd"]).then((res) => { // Update the keyboard shortcut for toggling the extension.
    if (res.ToggleExtensionCmd) document.getElementById("toggleShortcut").textContent = res.ToggleExtensionCmd.join(" ");
})

let check = { // Key: checkbox ID, Value: the property to change in the storage
    "autoCover": "AutoApply",
    "stretch": "IsStretched",
    "preventDefault": "PreventDefault"
}
for (let item in check) {
    document.getElementById(item).onchange = () => setItem(check[item], document.getElementById(item).checked ? "1" : "0"); // If checked, write 1 to the storage. Otherwise, write 0.
    browserToUse.storage.sync.get([check[item]]).then((res) => { if ((res[check[item]] ?? "") !== "") document.getElementById(item).checked = res[check[item]] === "1" }); // Get the value of that item and update the DOM
}


function setItem(key, value) {
    browserToUse.storage.sync.set({ [key]: value });
}
document.getElementById("fillHeight").onchange = () => {
    setItem("HeightFill", document.getElementById("fillHeight").value);
    updateFillHeightDesc();
};
function updateFillHeightDesc() {
    switch (document.getElementById("fillHeight").value) {
        case "0":
            document.getElementById("fillHeightMeaning").textContent = "";
            document.getElementById("fillHeightMeaning").style.display = "none";
            break;
        case "1":
            document.getElementById("fillHeightMeaning").textContent = "The video will be scaled only if there are black bars at the top/bottom of the screen. If the video fills the height of the screen, it won't be scaled. This can be helpful if you listen to music videos, and you want to continue seeing the album art of the music you're listening to.";
            document.getElementById("fillHeightMeaning").style.display = "block";
            break;
        case "2":
            document.getElementById("fillHeightMeaning").textContent = "The video will be scaled only if there are black bars at the left/right of the screen. If the video fills the width of the screen, it won't be scaled.";
            document.getElementById("fillHeightMeaning").style.display = "block";
            break;
    }
}
browserToUse.storage.sync.get(["HeightFill"]).then((res) => { document.getElementById("fillHeight").value = res["HeightFill"] ?? "0"; updateFillHeightDesc() });

document.getElementById("grantAccess").onclick = () => { // Request the access to the YouTube webpage
    browserToUse.permissions.request({ origins: ["https://*.youtube.com/*"] }).then(() => checkPermission());
}
function checkPermission() { // Check if the user has granted permission to the extension to access the YouTube webpage, so that, if false, a warning on the extension UI will be shown.
    browserToUse.permissions.contains({ origins: ["https://*.youtube.com/*"] }).then((permission) => permissionStep2(permission));
    function permissionStep2(permission) {
        document.getElementById("requireAccess").style.display = permission ? "none" : "block";
    }
}
checkPermission();