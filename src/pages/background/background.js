"use strict";

import youtubeHelper from "../../assets/javascripts/helpers/youtube.js";

const youtubeDomains = youtubeHelper.targets;
const invidiousInstances = youtubeHelper.redirects;

let disableInvidious;
let alwaysProxy;
let onlyEmbeddedVideo;
let videoQuality;
let invidiousInstance;
let invidiousDarkMode;
let invidiousVolume;
let invidiousPlayerStyle;
let invidiousSubtitles;
let invidiousAutoplay;

window.browser = window.browser || window.chrome;

browser.storage.sync.get(
  [
    "invidiousInstance",
    "disableInvidious",
    "alwaysProxy",
    "onlyEmbeddedVideo",
    "videoQuality",
    "invidiousDarkMode",
    "invidiousVolume",
    "invidiousPlayerStyle",
    "invidiousSubtitles",
    "invidiousAutoplay",
  ],
  (result) => {
    invidiousInstance = result.invidiousInstance;
    disableInvidious = result.disableInvidious;
    alwaysProxy = result.alwaysProxy;
    onlyEmbeddedVideo = result.onlyEmbeddedVideo;
    videoQuality = result.videoQuality;
    invidiousDarkMode = result.invidiousDarkMode;
    invidiousVolume = result.invidiousVolume;
    invidiousPlayerStyle = result.invidiousPlayerStyle;
    invidiousSubtitles = result.invidiousSubtitles || "";
    invidiousAutoplay = result.invidiousAutoplay;
  }
);

browser.storage.onChanged.addListener((changes) => {
  if ("invidiousInstance" in changes) {
    invidiousInstance = changes.invidiousInstance.newValue;
  }
  if ("disableInvidious" in changes) {
    disableInvidious = changes.disableInvidious.newValue;
  }
  if ("alwaysProxy" in changes) {
    alwaysProxy = changes.alwaysProxy.newValue;
  }
  if ("onlyEmbeddedVideo" in changes) {
    onlyEmbeddedVideo = changes.onlyEmbeddedVideo.newValue;
  }
  if ("videoQuality" in changes) {
    videoQuality = changes.videoQuality.newValue;
  }
  if ("invidiousDarkMode" in changes) {
    invidiousDarkMode = changes.invidiousDarkMode.newValue;
  }
  if ("invidiousVolume" in changes) {
    invidiousVolume = changes.invidiousVolume.newValue;
  }
  if ("invidiousPlayerStyle" in changes) {
    invidiousPlayerStyle = changes.invidiousPlayerStyle.newValue;
  }
  if ("invidiousSubtitles" in changes) {
    invidiousSubtitles = changes.invidiousSubtitles.newValue;
  }
  if ("invidiousAutoplay" in changes) {
    invidiousAutoplay = changes.invidiousAutoplay.newValue;
  }
});

function redirectYouTube(url, initiator, type) {
  if (disableInvidious) {
    return null;
  }
  if (
    initiator &&
    (initiator.origin === invidiousInstance ||
      invidiousInstances.includes(initiator.origin) ||
      youtubeDomains.includes(initiator.host))
  ) {
    return null;
  }
  if (url.pathname.match(/iframe_api/) || url.pathname.match(/www-widgetapi/)) {
    // Don't redirect YouTube Player API.
    return null;
  }
  if (url.host.split(".")[0] === "studio") {
    // Avoid redirecting `studio.youtube.com`
    return null;
  }
  if (onlyEmbeddedVideo && type !== "sub_frame") {
    return null;
  }
  // Apply settings
  if (alwaysProxy) {
    url.searchParams.append("local", true);
  }
  if (videoQuality) {
    url.searchParams.append("quality", videoQuality);
  }
  if (invidiousDarkMode) {
    url.searchParams.append("dark_mode", invidiousDarkMode);
  }
  if (invidiousVolume) {
    url.searchParams.append("volume", invidiousVolume);
  }
  if (invidiousPlayerStyle) {
    url.searchParams.append("player_style", invidiousPlayerStyle);
  }
  if (invidiousSubtitles) {
    url.searchParams.append("subtitles", invidiousSubtitles);
  }
  if (invidiousAutoplay) {
    url.searchParams.append("autoplay", 1);
  }

  return `${invidiousInstance}${url.pathname}${url.search}`;
}

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = new URL(details.url);
    let initiator;
    if (details.originUrl) {
      initiator = new URL(details.originUrl);
    } else if (details.initiator) {
      initiator = new URL(details.initiator);
    }
    let redirect;
    if (youtubeDomains.includes(url.host)) {
      redirect = {
        redirectUrl: redirectYouTube(url, initiator, details.type),
      };
    }
    if (redirect && redirect.redirectUrl) {
      console.info(
        "Redirecting",
        `"${url.href}"`,
        "=>",
        `"${redirect.redirectUrl}"`
      );
      console.info("Details", details);
    }
    return redirect;
  },
  {
    urls: ["*://*.youtube.com/*", "*://*.youtu.be/*"],
  },
  ["blocking"]
);

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "update") {
    browser.storage.sync.get(
      ["invidiousInstance"],
      (result) => {
        if (result.invidiousInstance === "https://invidio.us") {
          browser.storage.sync.set({
            invidiousInstance: null,
          });
        }
      }
    );
  }
});
