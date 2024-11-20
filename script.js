// Key: c1f80921-2d9d-484a-b297-a221cdd62746
const apiKey = "c1f80921-2d9d-484a-b297-a221cdd62746";
const output = document.getElementById("output");

let latitude;
let longitude;

document.addEventListener("DOMContentLoaded", () => {
  init();
});

function init() {
  getLocation();
  //   useFetchedStops();
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
  output.textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;
  useFetchedStops();
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

async function fetchStops(lat, long, maxNo = 100, radius = 100000, lang = "en") {
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
    console.log("res: ", response);
    const data = await response.json();
    console.log("Data: ", data.stopLocationOrCoordLocation);
    return data.stopLocationOrCoordLocation;
  } catch (error) {
    console.error("Error fetching nearby stops", error);
    return [];
  }
}

function useFetchedStops() {
  if (latitude && longitude) {
    fetchStops(latitude, longitude).then((stops) => {
      console.log("Nearby stops: ", stops);
    });
  }
}
