// Key: c1f80921-2d9d-484a-b297-a221cdd62746
const apiKey = "c1f80921-2d9d-484a-b297-a221cdd62746";
const output = document.getElementById("output");
const closestStopsContainer = document.getElementById("closestStopsContainer");

const latitudeLocalStorageKey = "latitude";
const longitudeLocalStorageKey = "lonitude";
const stopsLocalStorageKey = "stops";

let latitude;
let longitude;

document.addEventListener("DOMContentLoaded", () => {
  init();
});

function init() {
  getLocation();
  //   useFetchedStops();
}

function renderClosestStops(stops) {
  closestStopsContainer.innerHTML = "";
  const stopsName = stops.map((stop) => stop.StopLocation.name);

  stopsName.forEach((stop) => {
    const justName = stop.split(".")[0].split(" (")[0];
    const li = document.createElement("li");
    li.innerText = justName;
    closestStopsContainer.appendChild(li);
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
        renderClosestStops(closestStop);
      });
      console.log("Data fetched");
    } else {
      console.log("Data loaded");
      const closestStop = findClosestStops(latitude, longitude, loadStops);
      renderClosestStops(closestStop);
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

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key) {
  return JSON.parse(localStorage.getItem(key));
}
