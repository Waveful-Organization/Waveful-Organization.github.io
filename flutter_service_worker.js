'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "version.json": "3fdad7801aca543a531fffd608315f1b",
"favicon.ico": "57267dcd85a3ce2f29b9c3c9a03ed4d0",
"index.html": "9fe01b38ad8409c3bbd49450320c8bbe",
"/": "9fe01b38ad8409c3bbd49450320c8bbe",
"CNAME": "124e4042fbf152059b5805ece63fc59c",
"main.dart.js": "f62d8436c3c4ce592db2716311fab9ad",
".well-known/apple-app-site-association": "ce159c72f11d038a7c31be342a8e5baa",
".well-known/assetlinks.json": "fea1b071971ab748312527021f48dbd5",
"404.html": "c240fca86aaeb917e5673fd3b7ef21d9",
"apple-app-site-association": "a01099a588110240d493fb03af7ed305",
"app-ads.txt": "b345000f19c14c680aaaf0f9c105a221",
"icons/Icon-192.png": "f9943b33208092666af48c9a4b9dc6c9",
"icons/Icon-512.png": "b60bc846c8353d869dd35d48e276f0f0",
"manifest.json": "d6cade67ccf1d2df1a0856f4f55addd7",
"assets/AssetManifest.json": "557df847e92c4d00f0033c403eeca165",
"assets/NOTICES": "fe08980f38a015363e0d2e53d24defb1",
"assets/FontManifest.json": "2aa978530016cf1c81ab2c82c4f8176c",
"assets/packages/material_design_icons_flutter/lib/fonts/materialdesignicons-webfont.ttf": "174c02fc4609e8fc4389f5d21f16a296",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/assets/icon.png": "b60bc846c8353d869dd35d48e276f0f0",
"assets/assets/mockups/phone_light.png": "0adb5866bb8dd8b2ba66f042f3a80e12",
"assets/assets/mockups/phone_dark.png": "2bdaebb90234f2f8f42d6a4ebc09057a",
"assets/assets/fonts/coolvetica.ttf": "5d474fd2ebc6ef77c9bf3219391bed9c",
"assets/assets/fonts/CustomIcons.ttf": "4ebf440dfc5a45f4a54a6c0ac2ded980",
"assets/assets/badges/apple/badge_apple_it.png": "69cc26dee52116d12f7f410bb7f358bb",
"assets/assets/badges/apple/badge_apple_es.png": "91268cae5cac31852d194aa57cfef01a",
"assets/assets/badges/apple/badge_apple_en.png": "dbb1c519ceb631ea06079dc005c67b44",
"assets/assets/badges/google/badge_google_es.png": "4263a06f4d3d0e7ab066e7145c58c992",
"assets/assets/badges/google/badge_google_it.png": "c701b48ca94ef5c3bbdb11c272c27afc",
"assets/assets/badges/google/badge_google_en.png": "db9b21a1c41f3dcd9731e1e7acfdbb57",
"assets/assets/small_icon.png": "516aaa6a4154c236dc3244e753513255"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
