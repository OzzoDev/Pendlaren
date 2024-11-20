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

  stop.forEach((depature) => {
    const li = document.createElement("li");
    const timeEl = document.createElement("p");
    const dateEl = document.createElement("p");
    const busEl = document.createElement("p");
    const directionEl = document.createElement("p");

    const time = extractDepatureTime(depature.time);
    const date = extractDate(depature.date);
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

function assignFetchStops(stopID) {
  fetchStop(stopID)
    .then((stop) => {
      currentStop = stop.Departure.map((stop) => {
        const time = stop.time;
        const date = stop.JourneyDetailRef.ref;
        const name = stop.name;
        const direction = stop.direction;
        return { time: time, date: date, name: name, direction: direction };
      });
      currentStop = modifyStopArray(currentStop);
      save(currentStopKey, { stop: currentStop, fetchAt: new Date() });
      render(currentStop);
    })
    .catch((error) => {
      console.error("Error fetching stop:", error);
    });
}

function useFetchedStop(stopID) {
  const loadStop = load(currentStopKey);
  if (!loadStop) {
    assignFetchStops(stopID);
  } else {
    const reFetch = compareWithTempDate(new Date(), loadStop.fetchAt, 60);
    if (reFetch) {
      console.log("Data refetched");
      assignFetchStops(stopID);
    } else {
      currentStop = loadStop;
      console.log("Data loaded", currentStop);
      setTimeout(() => {
        render(currentStop.stop);
      }, 100);
    }
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

function compareWithTempDate(date1, date2, timeLimitInSeconds) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const tempDate = new Date(d2);
  tempDate.setSeconds(tempDate.getSeconds() + timeLimitInSeconds);

  return d1 > tempDate;
}

function modifyStopArray(stop) {
  const stopsName = stop.map((stop) => stop.direction);
  const wordToClean = mostOccurringWord(stopsName);
  const cleaned = stop.map((stop) => ({ ...stop, direction: cleanString(stop.direction, wordToClean).trim() }));
  return cleaned;
}

function cleanString(str, wordToClean) {
  const regex = new RegExp(wordToClean, "gi");
  return str.replace(regex, "");
}

function mostOccurringWord(strings) {
  const wordCount = {};

  strings.forEach((string) => {
    const words = string.split(/\s+/);
    words.forEach((word) => {
      const cleanedWord = word.toLowerCase().replace(/[^\wåäöÅÄÖ]/g, "");
      if (cleanedWord && cleanedWord.toLowerCase() >= "a" && cleanedWord.toLowerCase() <= "z") {
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

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key) {
  return JSON.parse(localStorage.getItem(key));
}
