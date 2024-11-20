const apiKey = "c1f80921-2d9d-484a-b297-a221cdd62746";
const output = document.getElementById("output");
const closestStopsContainer = document.getElementById("closestStopsContainer");

const latitudeLocalStorageKey = "latitude";
const longitudeLocalStorageKey = "lonitude";
const stopsLocalStorageKey = "stops";
const stopNameLocalStorageKey = "stopName";
const stopIDLocalStorageKey = "stopID";

const timeTablePagePath = "stop.html";

let latitude;
let longitude;
let stops = [];
let unsortedStops = [];
let inputs = [];

document.addEventListener("DOMContentLoaded", () => {
  init();
});

function init() {
  getLocation();
  initSearch();
  initSort();
}

function initSearch() {
  const searchInput = document.getElementById("searchInput");
  const cancelSearchBtn = document.getElementById("cancelSearchBtn");

  inputs.push(searchInput);

  searchInput.addEventListener("input", () => {
    const searchQuery = removeDoubleSpaces(searchInput.value.trim());
    searchInput.value = searchQuery;
    if (searchQuery === "") {
      stops.forEach((stop) => (stop.visible = true));
      if (!cancelSearchBtn.getAttribute("class")) {
        cancelSearchBtn.setAttribute("class", "hidden");
      }
    } else {
      stops.forEach((stop) => (stop.name.toLowerCase().startsWith(searchQuery) ? (stop.visible = true) : (stop.visible = false)));
      if (cancelSearchBtn.getAttribute("class")) {
        cancelSearchBtn.removeAttribute("class");
      }
    }
    renderClosestStops(stops);
  });

  cancelSearchBtn.addEventListener("click", () => {
    const searchQuery = removeDoubleSpaces(searchInput.value.trim());
    if (searchQuery !== "") {
      stops.forEach((stop) => (stop.visible = true));
      renderClosestStops(stops);
      cancelSearchBtn.setAttribute("class", "hidden");
      searchInput.value = "";
    }
  });
}

function initSort() {
  const sortContainer = document.getElementById("sortContainer");
  const sortBtns = Array.from(sortContainer.getElementsByTagName("input"));

  sortBtns.forEach((btn) => {
    const index = Array.from(sortBtns).indexOf(btn);
    btn.addEventListener("click", () => {
      switch (index) {
        case 0:
          stops = unsortedStops;
          break;
        case 1:
          stops = stops.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }
      renderClosestStops(stops);
    });
  });
}

function renderClosestStops(stops) {
  closestStopsContainer.innerHTML = "";

  stops.forEach((stop) => {
    if (stop.visible) {
      const stopName = extractName(stop.name);
      const stopID = stop.extId;
      const li = document.createElement("li");
      li.innerText = stopName;
      li.addEventListener("click", () => {
        save(stopNameLocalStorageKey, stopName);
        save(stopIDLocalStorageKey, stopID);
        setTimeout(() => {
          redriect(timeTablePagePath);
        }, 100);
      });
      closestStopsContainer.appendChild(li);
    }
  });
}

function getLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    output.textContent = "Geolocation is not supported by this browser.";
  }
}

function success(position) {
  latitude = position.coords.latitude;
  longitude = position.coords.longitude;

  const loadLatitude = load(latitudeLocalStorageKey);
  const loadLongitude = load(longitudeLocalStorageKey);

  if (!loadLatitude || loadLatitude !== latitude) {
    save(latitudeLocalStorageKey, latitude);
  }

  if (!loadLongitude || loadLongitude !== longitude) {
    save(longitudeLocalStorageKey, longitude);
  }

  output.textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;
  useFetchedStops(loadLatitude, loadLongitude);
}

function error(err) {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      output.textContent = "User denied the request for Geolocation.";
      break;
    case err.POSITION_UNAVAILABLE:
      output.textContent = "Location information is unavailable.";
      break;
    case err.TIMEOUT:
      output.textContent = "The request to get user location timed out.";
      break;
    case err.UNKNOWN_ERROR:
      output.textContent = "An unknown error occurred.";
      break;
  }
}

async function fetchStops(lat, long, maxNo = 100, radius = 10000, lang = "sv") {
  const baseUrl = "https://api.resrobot.se/v2.1/location.nearbystops";
  const params = new URLSearchParams({
    originCoordLat: lat,
    originCoordLong: long,
    accessId: apiKey,
    maxNo: maxNo,
    r: radius,
    lang: lang,
    format: "json",
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Data: ", data.stopLocationOrCoordLocation);
    return data.stopLocationOrCoordLocation;
  } catch (error) {
    console.error("Error fetching nearby stops", error);
    return [];
  }
}

function useFetchedStops(prevLat, prevLong) {
  if (latitude && longitude) {
    const loadStops = load(stopsLocalStorageKey);
    const loadLatitude = load(latitudeLocalStorageKey);
    const loadLongitude = load(longitudeLocalStorageKey);

    if (!loadStops || loadLatitude !== prevLat || loadLongitude !== prevLong) {
      fetchStops(latitude, longitude).then((stops) => {
        const closestStop = findClosestStops(latitude, longitude, stops);
        save(stopsLocalStorageKey, closestStop);
        stops = modifyStopsArray(closestStop);
        unsortedStops = modifyStopsArray(closestStop);
        renderClosestStops(stops);
      });
    } else {
      const closestStop = findClosestStops(latitude, longitude, loadStops);
      stops = modifyStopsArray(closestStop);
      unsortedStops = modifyStopsArray(closestStop);
      renderClosestStops(stops);
    }
  }
}

function extractCoordinates(stopId) {
  const parts = stopId.split("@");
  if (parts.length < 4) {
    console.error("Invalid stopId format:", stopId);
    return { lat: null, lon: null };
  }
  const x = parseFloat(parts[2].split("=")[1]);
  const y = parseFloat(parts[3].split("=")[1]);
  return { lat: y, lon: x };
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const rad1 = (lat1 * Math.PI) / 180;
  const rad2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(rad1) * Math.cos(rad2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findClosestStops(latitude, longitude, stops) {
  const stopsWithDistances = [];

  for (const stop of stops) {
    const { lat, lon } = extractCoordinates(stop.StopLocation.id);

    if (lat === null || lon === null) {
      console.error("Invalid coordinates for stop:", stop.StopLocation.id);
      continue;
    }

    const distance = haversineDistance(latitude, longitude, lat, lon);

    if (isNaN(distance)) {
      console.error("Distance calculation resulted in NaN for stop:", stop.StopLocation.id);
      continue;
    }

    stopsWithDistances.push({ stop, distance });
  }

  stopsWithDistances.sort((a, b) => a.distance - b.distance);

  return stopsWithDistances.map((item) => item.stop);
}

function extractName(name) {
  return name.split(".")[0].split(" (")[0];
}

function modifyStopsArray(stops) {
  const stopsName = stops.map((stop) => stop.StopLocation.name);
  const wordToClean = mostOccurringWord(stopsName);
  const cleaned = stops.map((stop) => ({ name: cleanString(stop.StopLocation.name, wordToClean).trim(), extId: stop.StopLocation.extId, visible: true }));
  return cleaned;
}

function mostOccurringWord(strings) {
  const wordCount = {};

  strings.forEach((string) => {
    const words = string.split(/\s+/);
    words.forEach((word) => {
      const cleanedWord = word.toLowerCase().replace(/[^\wåäöÅÄÖ]/g, "");
      if (cleanedWord) {
        wordCount[cleanedWord] = (wordCount[cleanedWord] || 0) + 1;
      }
    });
  });

  let maxCount = 0;
  let mostFrequentWord = "";

  for (const [word, count] of Object.entries(wordCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentWord = word;
    }
  }

  return mostFrequentWord;
}

function cleanString(str, wordToClean) {
  const regex = new RegExp(wordToClean, "gi");
  return str.replace(regex, "");
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

function clearInputs() {
  inputs.forEach((input) => (input.value = ""));
}

function removeDoubleSpaces(str) {
  return str.replace(/\s{2,}/g, " ");
}

function redriect(path) {
  clearInputs();
  window.location.href = path;
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key) {
  return JSON.parse(localStorage.getItem(key));
}
