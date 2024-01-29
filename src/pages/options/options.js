"use strict";

import commonHelper from "../../assets/javascripts/helpers/common.js";
import youtubeHelper from "../../assets/javascripts/helpers/youtube.js";

const invidiousInstances = youtubeHelper.redirects;
const autocompletes = [
  { id: "invidious-instance", instances: invidiousInstances },
];
const domparser = new DOMParser();

let invidiousInstance = document.getElementById("invidious-instance");
let disableInvidious = document.getElementById("disable-invidious");
let alwaysProxy = document.getElementById("always-proxy");
let onlyEmbeddedVideo = document.getElementById("only-embed");
let videoQuality = document.getElementById("video-quality");
let invidiousDarkMode = document.getElementById("invidious-dark-mode");
let persistInvidiousPrefs = document.getElementById("persist-invidious-prefs");
let invidiousVolume = document.getElementById("invidious-volume");
let invidiousPlayerStyle = document.getElementById("invidious-player-style");
let invidiousSubtitles = document.getElementById("invidious-subtitles");
let invidiousAutoplay = document.getElementById("invidious-autoplay");
let theme = document.getElementById("theme");

window.browser = window.browser || window.chrome;

browser.storage.sync.get(
  [
    "invidiousInstance",
    "disableInvidious",
    "alwaysProxy",
    "onlyEmbeddedVideo",
    "videoQuality",
    "invidiousDarkMode",
    "persistInvidiousPrefs",
    "invidiousVolume",
    "invidiousPlayerStyle",
    "invidiousSubtitles",
    "invidiousAutoplay",
    "theme",
  ],
  (result) => {
    theme.value = result.theme || "";
    if (result.theme) document.body.classList.add(result.theme);
    invidiousInstance.value = result.invidiousInstance || "";
    disableInvidious.checked = !result.disableInvidious;
    alwaysProxy.checked = result.alwaysProxy;
    onlyEmbeddedVideo.checked = result.onlyEmbeddedVideo;
    videoQuality.value = result.videoQuality || "";
    invidiousDarkMode.checked = result.invidiousDarkMode;
    persistInvidiousPrefs.checked = result.persistInvidiousPrefs;
    invidiousVolume.value = result.invidiousVolume;
    document.querySelector("#volume-value").textContent = result.invidiousVolume
      ? `${result.invidiousVolume}%`
      : " - ";
    invidiousPlayerStyle.value = result.invidiousPlayerStyle || "";
    invidiousSubtitles.value = result.invidiousSubtitles || "";
    invidiousAutoplay.checked = result.invidiousAutoplay;
  }
);

function openTab(tab, event) {
  let i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tab).style.display = "block";
  event.currentTarget.className += " active";
}

document
  .getElementById("general-tab")
  .addEventListener("click", openTab.bind(null, "general"));
document
  .getElementById("advanced-tab")
  .addEventListener("click", openTab.bind(null, "advanced"));

document.getElementById("general-tab").click();

function debounce(func, wait, immediate) {
  let timeout;
  return () => {
    let context = this,
      args = arguments;
    let later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    let callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

function parseURL(urlString) {
  if (urlString) {
    try {
      const url = new URL(urlString);
      if (url.username && url.password) {
        return `${url.protocol}//${url.username}:${url.password}@${url.host}`;
      } else {
        return url.origin;
      }
    } catch (error) {
      console.log(error);
      return "";
    }
  } else {
    return "";
  }
}

const invidiousInstanceChange = debounce(() => {
  if (invidiousInstance.checkValidity()) {
    browser.storage.sync.set({
      invidiousInstance: parseURL(invidiousInstance.value),
    });
  }
}, 500);
invidiousInstance.addEventListener("input", invidiousInstanceChange);

disableInvidious.addEventListener("change", (event) => {
  browser.storage.sync.set({ disableInvidious: !event.target.checked });
});

alwaysProxy.addEventListener("change", (event) => {
  browser.storage.sync.set({ alwaysProxy: event.target.checked });
});

onlyEmbeddedVideo.addEventListener("change", (event) => {
  browser.storage.sync.set({ onlyEmbeddedVideo: event.target.checked });
});

videoQuality.addEventListener("change", (event) => {
  browser.storage.sync.set({
    videoQuality: event.target.options[videoQuality.selectedIndex].value,
  });
});

invidiousDarkMode.addEventListener("change", (event) => {
  browser.storage.sync.set({ invidiousDarkMode: event.target.checked });
});

persistInvidiousPrefs.addEventListener("change", (event) => {
  browser.storage.sync.set({ persistInvidiousPrefs: event.target.checked });
});

const invidiousVolumeChange = debounce(() => {
  document.querySelector(
    "#volume-value"
  ).textContent = `${invidiousVolume.value}%`;
  browser.storage.sync.set({
    invidiousVolume: invidiousVolume.value,
  });
}, 500);
invidiousVolume.addEventListener("input", invidiousVolumeChange);

invidiousPlayerStyle.addEventListener("change", (event) => {
  browser.storage.sync.set({
    invidiousPlayerStyle:
      event.target.options[invidiousPlayerStyle.selectedIndex].value,
  });
});

const invidiousSubtitlesChange = debounce(() => {
  browser.storage.sync.set({ invidiousSubtitles: invidiousSubtitles.value });
}, 500);
invidiousSubtitles.addEventListener("input", invidiousSubtitlesChange);

invidiousAutoplay.addEventListener("change", (event) => {
  browser.storage.sync.set({ invidiousAutoplay: event.target.checked });
});

theme.addEventListener("change", (event) => {
  const value = event.target.options[theme.selectedIndex].value;
  switch (value) {
    case "dark-theme":
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
      break;
    case "light-theme":
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
      break;
    default:
      document.body.classList.remove("light-theme");
      document.body.classList.remove("dark-theme");
  }
  browser.storage.sync.set({
    theme: value,
  });
});

function autocomplete(input, list) {
  let currentFocus;
  input.addEventListener("focus", (e) => {
    showOptions(e, true);
  });
  input.addEventListener("input", (e) => {
    const val = e.target.value;
    if (!val) {
      return false;
    }
    currentFocus = -1;
    showOptions(e);
  });
  input.addEventListener("keydown", function (e) {
    let x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      currentFocus++;
      addActive(x);
    } else if (e.keyCode == 38) {
      currentFocus--;
      addActive(x);
    } else if (e.keyCode == 13) {
      e.preventDefault();
      if (currentFocus > -1) {
        if (x) x[currentFocus].click();
      }
    }
  });
  function showOptions(event, showAll = false) {
    let div,
      i,
      val = event.target.value;
    closeAllLists();
    div = document.createElement("div");
    div.setAttribute("id", event.target.id + "autocomplete-list");
    div.setAttribute("class", "autocomplete-items");
    event.target.parentNode.appendChild(div);
    for (i = 0; i < list.length; i++) {
      if (list[i].toLowerCase().indexOf(val.toLowerCase()) > -1) {
        div.appendChild(getItem(list[i], val));
      } else if (showAll) {
        div.appendChild(getItem(list[i], val));
      }
    }
  }
  function getItem(item, val) {
    const div = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = item.substr(0, val.length);
    div.innerText = item.substr(val.length);
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.value = item;
    div.prepend(strong);
    div.appendChild(hiddenInput);
    div.addEventListener("click", function (e) {
      input.value = div.getElementsByTagName("input")[0].value;
      input.dispatchEvent(new Event("input"));
      closeAllLists();
    });
    return div;
  }
  function addActive(x) {
    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = x.length - 1;
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    for (let i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    let x = document.getElementsByClassName("autocomplete-items");
    for (let i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != input) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  document.addEventListener("click", (e) => {
    if (!autocompletes.find((element) => element.id === e.target.id)) {
      closeAllLists(e.target);
    }
  });
}

autocompletes.forEach((value) => {
  autocomplete(document.getElementById(value.id), value.instances);
});

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function () {
    this.classList.toggle("collapsible-active");
    var content = this.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });
}
