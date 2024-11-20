const timeTable = document.getElementById("timeTable");
const stopNameHeader = document.getElementById("stop");

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
  const stopName = load(stopNameLocalStorageKey);
  if (stopID) {
    stopNameHeader.innerText = stopName;
    currentStopKey += stopID;
    useFetchedStop(stopID);
  } else {
    console.log("No Id found");
  }
}

function render(stop) {
  timeTable.innerHTML = "";

  const depatures = stop.Departure;

  depatures.forEach((depature) => {
    const li = document.createElement("li");
    const timeEl = document.createElement("p");
    const dateEl = document.createElement("p");
    const busEl = document.createElement("p");
    const directionEl = document.createElement("p");

    const time = extractDepatureTime(depature.time);
    const date = extractDate(depature.JourneyDetailRef.ref);
    const bus = extractBus(depature.name);
    const direction = extractDirection(depature.direction);

    timeEl.innerText = `${time}`;
    dateEl.innerText = `${date}`;
    busEl.innerText = `Linje - ${bus}`;
    directionEl.innerText = `Riktning - ${direction}`;

    li.appendChild(timeEl);
    li.appendChild(dateEl);
    li.appendChild(busEl);
    li.appendChild(directionEl);

    timeTable.appendChild(li);
  });
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
  console.log("CurrKey: ", currentStopKey);
  const loadStop = load(currentStopKey);
  if (!loadStop) {
    fetchStop(stopID)
      .then((stop) => {
        currentStop = stop;
        save(currentStopKey, currentStop);
        render(currentStop);
      })
      .catch((error) => {
        console.error("Error fetching stop:", error);
      });
  } else {
    currentStop = loadStop;
    console.log("Data loaded", currentStop);
    render(currentStop);
  }
}

function extractName(name) {
  return name.split(".")[0].split(" (")[0];
}

function extractDepatureTime(str) {
  const time = str.split(":");
  return `${time[0]}:${time[1]}`;
}

function extractDate(str) {
  const date = str.split("|");
  return date[date.length - 1];
}

function extractDirection(str) {
  return str.split(" (")[0];
}

function extractBus(str) {
  return str.split("- ")[1].split(" ")[1];
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
