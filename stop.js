const apiKey = "c1f80921-2d9d-484a-b297-a221cdd62746";
const stopNameLocalStorageKey = "stopName";
const stopIDLocalStorageKey = "stopID";
const stopLocalStorageKey = "stop";
let currentStopKey = stopLocalStorageKey;

const startPagePath = "index.html";

let currentStop;

document.addEventListener("DOMContentLoaded", () => {
  init();
});

function init() {
  const stopID = load(stopIDLocalStorageKey);
  if (stopID) {
    currentStopKey.concat(stopID);
    useFetchedStop(stopID);
  } else {
    console.log("No Id found");
  }
}

async function fetchStop(stopID) {
  const url = `https://api.resrobot.se/v2.1/departureBoard?id=${stopID}&format=json&accessId=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const data = await response.json();
    console.log("Fetched Data: ", data);
    return data;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    return [];
  }
}

function useFetchedStop(stopID) {
  const loadStop = load(currentStopKey);
  if (!loadStop) {
    fetchStop(stopID)
      .then((stop) => {
        currentStop = stop;
        save(currentStopKey, currentStop);
      })
      .catch((error) => {
        console.error("Error fetching stop:", error);
      });
  } else {
    currentStop = loadStop;
    console.log("Data, loaded", currentStop);
  }
}

function extractName(name) {
  return name.split(".")[0].split(" (")[0];
}

function redriect(path) {
  window.location.href = path;
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key) {
  return JSON.parse(localStorage.getItem(key));
}
