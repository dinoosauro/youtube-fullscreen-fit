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
    await setItem("ToggleExtensionCmd", combination); // Save the new combination
    await sendMessage({ action: "updateKeyboardShortcut", content: combination }); // Ask the main script to update the settings, so that they can be applied the next time the user will put the video in fullscreen mode.
}

/**
 * Send a message to the main script
 * @param {any} obj the object to send to the main script
 */
async function sendMessage(obj) {
    const ids = await browserToUse.tabs.query({ active: true }); 
    browserToUse.tabs.sendMessage(ids[0].id, obj);
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
    document.getElementById(item).onchange = async () => {
        await setItem(check[item], document.getElementById(item).checked ? "1" : "0"); // If checked, write 1 to the storage. Otherwise, write 0.
        await sendMessage({action: "updateNeedsToBeApplied"});
    }
    browserToUse.storage.sync.get([check[item]]).then((res) => { if ((res[check[item]] ?? "") !== "") document.getElementById(item).checked = res[check[item]] === "1" }); // Get the value of that item and update the DOM
}

async function setItem(key, value) {
    await browserToUse.storage.sync.set({ [key]: value });
}

document.getElementById("fillHeight").onchange = async () => {
    await setItem("HeightFill", document.getElementById("fillHeight").value);
    await sendMessage({action: "updateNeedsToBeApplied"});
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
    browserToUse.permissions.request({ origins: [getOriginToRequest()] }).then(() => checkPermission());
}
function checkPermission() { // Check if the user has granted permission to the extension to access the YouTube webpage, so that, if false, a warning on the extension UI will be shown.
    browserToUse.permissions.contains({ origins: [getOriginToRequest()] }).then((permission) => permissionStep2(permission));
    function permissionStep2(permission) {
        document.getElementById("requireAccess").style.display = permission ? "none" : "block";
    }
}

/**
 * TODO: look to the webpage URL and ask only that hostname.
 */
function getOriginToRequest() {
    return ["https://inv.nadeko.net/*", "https://yewtu.be/*", "https://invidious.nerdvpn.de/*", "https://invidious.f5.si/*", "https://*.youtube.com/"];
}
checkPermission();
document.getElementById("version").textContent = browserToUse.runtime.getManifest().version;