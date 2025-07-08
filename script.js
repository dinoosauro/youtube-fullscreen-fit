/**
 * The Manifest V3 API
 */
const browserToUse = typeof chrome === "undefined" ? browser : chrome;

/**
 * An array that contains all the pressed keys in lowercase
 */
let clickedElements = [];

/**
 * An Object that contains some functions that are called from event listeners
 */
const eventsContainer = {
    /**
     * Add the key to the array and check if it's valid
     * The event that should be triggered for the "keydown" keyboard event
     * @param {KeyboardEvent} e 
     */
    keydown: (e) => {
        needsToBeApplied.preventDefaultEvents && e.preventDefault();
        clickedElements.push(e.key.toLowerCase());
        if (!document.fullscreenElement) return;
        needsToBeApplied.toggleExtension.length > 0 && needsToBeApplied.toggleExtension.every(key => clickedElements.indexOf(key) !== -1) && document.querySelector("[data-ytfullscreenfitresize], [data-ytfullscreenfitexit]").click();
    },
    /**
     * Delete everything
     * The event that should be triggered for the "keyup" keyboard event
     * @param {KeyboardEvent} e 
     */
    keyup: (e) => {
        clickedElements = [];
    },
    /**
     * Receive a message from the extension UI
     * @param {any} message the Object received from the UI, composed by {content: any, action: string}
     */
    onMessage: (message) => {
        switch (message.action) {
            case "updateKeyboardShortcut": // Update keyboard shortcut to toggle the extension
                needsToBeApplied.toggleExtension = message.content;
                break;
        }

    }
}

/**
 * The array that contains all the MutationObserver that are currently running
 */
let observerArr = [];
/**
 * The array that contains all the intervals that are currently running
 */

let intervalArr = [];
/**
 * Create the button for the YouTube video player
 */
function btnCreate({ attr, img, hover }) {
    // Button image
    let clickImg = document.createElement("img");
    clickImg.classList.add("ytp-button");
    clickImg.setAttribute(attr, "");
    clickImg.src = URL.createObjectURL(new Blob([img], { type: "image/svg+xml" }));
    // First hover container
    let hoverElement = document.createElement("div");
    hoverElement.classList.add("ytp-tooltip", "ytp-rounded-tooltip", "ytp-bottom");
    // Second hover container
    let hoverContainer = document.createElement("div");
    hoverContainer.classList.add("ytp-tooltip-bottom-text");
    // Hover text
    let hoverText = document.createElement("span");
    hoverText.classList.add("ytp-tooltip-text");
    hoverText.textContent = hover;
    hoverText.style.fontSize = "1.8rem";
    /**
     * Try to get YouTube's text color. Fallbacks to "red" if nothing is found.
     */
    function fetchColor() {
        function timeout() { // Retry after 500 ms
            hoverText.style.color = "red";
            setTimeout(() => { fetchColor() }, 500);
        }
        try {
            hoverText.style.color = getComputedStyle((document.querySelector(".ytp-time-duration") ?? document.querySelector(".yt-core-attributed-string"))).color; // Get the color used in other parts of the player    
        } catch (ex) {
            timeout();
        }
    }
    fetchColor()
    hoverText.classList.add("ytp-tooltip-text", "ytp-tooltip-text-no-title");
    hoverContainer.append(hoverText);
    hoverContainer.setAttribute("data-ytfullscreenresizegeneral", "");
    hoverElement.append(hoverContainer);
    hoverElement.setAttribute(`${attr}hover`, "");
    hoverElement.style = "position: absolute; z-index: 999";
    clickImg.onmouseenter = () => { // Show the hover when the mouse is on the button
        hoverElement.style.top = `${clickImg.getBoundingClientRect().top - 30}px`;
        hoverElement.style.left = `${clickImg.getBoundingClientRect().left - 15}px`;
        document.body.append(hoverElement);
    }
    clickImg.onmouseleave = () => { // And remove it when the mouse has left the item
        hoverElement.remove();
    }
    return clickImg;
}
let needsToBeApplied = {
    /**
     * If the extension should fill the video automatically
     */
    default: true,
    /**
     * If the user has requested to fill the video
     */
    force: false,
    /**
     * The style the video should be filled. Can be "cover" (scale it) or "fill" (stretch it)
     */
    fillStyle: "cover",
    /**
     * Video will be stretched only if, by default, the video wouldn't fully occupy the webpage in its height
     */
    keepHeight: 0,
    /**
     * The combination of keys to press to enable or disable fullscreen fit
     */
    toggleExtension: [],
    /**
     * Calls `e.preventDefault()` when the user presses a key on the webpage.
     */
    preventDefaultEvents: false,
};
/**
 * Checks if the provided selector (and its hover element) exists, and, if true, removes it from the DOM.
 * @param {string} selector the data-element string
 */
function removeItem(selector) {
    if ((document.querySelector(`[${selector}]`) ?? "") !== "") document.querySelector(`[${selector}]`).remove();
    if ((document.querySelector(`[${selector}hover]`) ?? "") !== "") document.querySelector(`[${selector}hover]`).remove();
}
/**
 * Update the YouTube video player
 */
function applyItem() {
    let element = document.querySelector(".html5-video-container").querySelector("video"); // Get the video element
    removeItem("data-ytfullscreenfitresize");
    element.style.height = `100vh`;  // The player must fill the screen
    element.style.width = `100vw`; // The player must fill the screen
    element.style.objectFit = needsToBeApplied.fillStyle; // Apply the objectFit style, so that the content is filled
    ["top", "left"].forEach(e => { element.style[e] = "0px" }); // Put it on the top of the page
    !document.querySelector("[data-ytfullscreenfitexit]") && (document.querySelector(".ytp-right-controls") ?? buttons.mobileFix).prepend(buttons.exit); // If no "exit" button is on the DOM, add one, so that the user can return to the classic video view.
    !document.querySelector(".ytp-right-controls") && document.querySelector(".player-controls-top.with-video-details").prepend(buttons.mobileFix); // The user is using YouTube mobile, so we need to add a div that'll contain the image. This div will be prepended so that it's at the right of the autoplay switch.
}
/**
 * The object that'll contain the buttons to adapt the video to screen size (or go back to normal view)
 */
let buttons = {
    /**
     * Fill the video
     */
    resize: (() => {
        let clickImg = btnCreate({ hover: "Fill the video to screen width and height", img: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-4 -4 32 32"><path fill="#f0f0f0" d="M21.25 13a.75.75 0 0 1 .743.648l.007.102v5a3.25 3.25 0 0 1-3.065 3.245L18.75 22h-4.668c.537-.385.974-.9 1.265-1.499l3.403-.001a1.75 1.75 0 0 0 1.744-1.607l.006-.143v-5a.75.75 0 0 1 .75-.75Zm-9.5-4A3.25 3.25 0 0 1 15 12.25v6.5A3.25 3.25 0 0 1 11.75 22h-6.5A3.25 3.25 0 0 1 2 18.75v-6.5A3.25 3.25 0 0 1 5.25 9h6.5Zm-5.689 4.103a.5.5 0 0 0-.06.24v4.315a.5.5 0 0 0 .739.439l3.955-2.158a.5.5 0 0 0 0-.878L6.74 12.903a.5.5 0 0 0-.679.2ZM18.751 2a3.25 3.25 0 0 1 3.244 3.066L22 5.25v5a.75.75 0 0 1-1.493.102l-.007-.102v-5a1.75 1.75 0 0 0-1.606-1.744L18.75 3.5h-5a.75.75 0 0 1-.102-1.493L13.75 2h5Zm-8.5 0a.75.75 0 0 1 .1 1.493l-.1.007h-5a1.75 1.75 0 0 0-1.745 1.606L3.5 5.25v3.402c-.599.292-1.114.73-1.5 1.266V5.25a3.25 3.25 0 0 1 3.066-3.245L5.25 2h5Z"/></svg>`, attr: "data-ytfullscreenfitresize" });
        clickImg.onclick = () => { // Force to adapt the video
            needsToBeApplied.force = true;
            applyItem();
        }
        return clickImg;
    })(),
    /**
     * Go back to normal view
     */
    exit: (() => {
        let clickImg = btnCreate({ hover: "Make the video go back to previous screen and height", attr: "data-ytfullscreenfitexit", img: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-4 -4 32 32"><path fill="#f0f0f0" d="M5.25 3A3.25 3.25 0 0 0 2 6.25v11.5A3.25 3.25 0 0 0 5.25 21h13.5A3.25 3.25 0 0 0 22 17.75V6.25A3.25 3.25 0 0 0 18.75 3H5.25ZM9 9.25a1 1 0 0 1 1.482-.876l5 2.75a1 1 0 0 1 0 1.753l-5 2.75A1 1 0 0 1 9 14.75v-5.5Z"/></svg>` });
        clickImg.onclick = () => {
            needsToBeApplied.force = false; // Avoid restoring the video as filled
            needsToBeApplied.default = false; // Avoid restoring the video as filled
            document.querySelector(".html5-video-container").querySelector("video").style.objectFit = "contain"; // Go back to having the video contained entirely in the page (so with borders)
            removeItem("data-ytfullscreenfitexit"); // Remove this button
            !document.querySelector("[data-ytfullscreenfitresize]") && (document.querySelector(".ytp-right-controls") ?? buttons.mobileFix).prepend(buttons.resize); // And put the resize button
            !document.querySelector(".ytp-right-controls") && document.querySelector(".player-controls-top.with-video-details").prepend(buttons.mobileFix); // The user is using YouTube mobile, so we need to add a div that'll contain the image. This div will be prepended so that it's at the right of the autoplay switch.
        };
        return clickImg;
    })(),
    mobileFix: (() => { // A div that will contain the resize/exit button on mobile YouTube, so that it'll have a correct width/height. This div will be added at the left of the autoplay switch.
        let div = document.createElement("div");
        div.style = "width: 36px; padding: 6px;";
        div.setAttribute("data-ytfullscreenmobilefixdiv", "");
        if ((document.getElementById("player-container-id") ?? "") !== "") document.getElementById("player-container-id").append(div);
        return div;
    })()
}

function main() {
    /**
     * Read the value of the local storage for extension.
     */
    function readLocalVal(val) {
        needsToBeApplied.default = val.AutoApply !== "0";
        needsToBeApplied.fillStyle = val.IsStretched !== "0" ? "cover" : "fill";
        needsToBeApplied.keepHeight = isNaN(+val.HeightFill) ? 0 : +val.HeightFill;
        needsToBeApplied.toggleExtension = val.ToggleExtensionCmd ?? [];
        needsToBeApplied.preventDefaultEvents = val.PreventDefault === "1";
    }
    /**
     * Get settings from the local storage for extension
     */
    function reSyncSettings() {
        browserToUse.storage.sync.get(["AutoApply", "IsStretched", "HeightFill", "ToggleExtensionCmd", "PreventDefault"]).then((val) => readLocalVal(val));
    }
    reSyncSettings();
    let observer = new MutationObserver(() => { // Observe for mutations in the classes of the "movie_player" div. When full screen, this item obtains the "ytp-fullscreen" class.
        if (document.getElementById("movie_player").classList.contains("ytp-fullscreen")) { // Fullscreen
            if ((needsToBeApplied.default &&
                (needsToBeApplied.keepHeight === 0
                    || (needsToBeApplied.keepHeight === 1 && (document.querySelector(".html5-video-container").querySelector("video").videoWidth / document.querySelector(".html5-video-container").querySelector("video").videoHeight) > (window.innerWidth / window.innerHeight))
                    || (needsToBeApplied.keepHeight === 2 && (document.querySelector(".html5-video-container").querySelector("video").videoWidth / document.querySelector(".html5-video-container").querySelector("video").videoHeight) < (window.innerWidth / window.innerHeight))
                )) || needsToBeApplied.force) applyItem(); else if (!document.querySelector("[data-ytfullscreenfitresize]")) {
                    (document.querySelector(".ytp-right-controls") ?? buttons.mobileFix).prepend(buttons.resize); // If it needs to be applied, do it. Otherwise, show the button to enlarge the video.
                    !document.querySelector(".ytp-right-controls") && document.querySelector(".player-controls-top.with-video-details").prepend(buttons.mobileFix); // The user is using YouTube mobile, so we need to add a div that'll contain the image. This div will be prepended so that it's at the right of the autoplay switch.
                }
        } else { // Probably not fullscreen
            if ((document.fullscreenElement ?? "") === "") { // No fullscreen element found
                needsToBeApplied.force = false; // Avoid filling the video again
                reSyncSettings(); // And get previous settings
            }
            for (let item of ["data-ytfullscreenfitresize", "data-ytfullscreenfitexit"]) removeItem(item); // Remove the buttons
        }
    })
    observerArr.push(observer);
    function startMoviePlayer() {
        ((document.getElementById("movie_player") ?? "") === "") ? setTimeout(() => { startMoviePlayer(); }, 50) : observer.observe(document.getElementById("movie_player"), { attributes: true }) // Start observing the movie_player if the "movie_player" element has appeared
    }
    intervalArr.push(setInterval(() => {
        ((document.getElementById("movie_player") ?? "") !== "" && document.getElementById("movie_player").classList.contains("ytp-fullscreen") && (document.querySelector("[data-ytfullscreenresizegeneral]") ?? "") === "") && startMoviePlayer();
    }, 500));
    startMoviePlayer(); // Wait until the movie_player id is found

    // Now, we'll set up keyboard listeners, to make sure that the toggle shortcut can work.

    try { // We'll remove the event listeners, so that we avoid having the same function triggered multiple times when changing video from a playlist.
        window.removeEventListener("keydown", eventsContainer.keydown);
        window.removeEventListener("keyup", eventsContainer.keyup);
        browserToUse.runtime.onMessage.removeListener(eventsContainer.onMessage);
    } catch (ex) {
        // Nothing
    }

    window.addEventListener("keydown", eventsContainer.keydown);
    window.addEventListener("keyup", eventsContainer.keyup);
    browserToUse.runtime.onMessage.addListener(eventsContainer.onMessage);
}
function mainCheck() {
    ((document.querySelector(".html5-video-player") ?? "") !== "") ? main() : setTimeout(() => { mainCheck() }, 50);
}
mainCheck();
let oldWeb = window.location.href; // Store the first URL
setInterval(() => { // Check if the URL has changed
    if (oldWeb !== window.location.href) {// Disconnect every observer, remove every button and recreate all the events
        for (let item of observerArr) {
            try {
                item.disconnect();
            } catch (ex) {
                console.warn(ex);
            }
        }
        for (let item of intervalArr) clearTimeout(item);
        buttons.mobileFix.style.display = "none";
        for (let item of ["data-ytfullscreenfitresize", "data-ytfullscreenfitexit", "data-ytfullscreenresizegeneral"]) removeItem(item);
        oldWeb = window.location.href;
        mainCheck();
    }
}, 450)

