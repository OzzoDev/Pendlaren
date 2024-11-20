const output = document.getElementById("output");

let latitude;
let longitude;

document.addEventListener("DOMContentLoaded", () => {
  init();
});

function init() {
  getLocation();
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
