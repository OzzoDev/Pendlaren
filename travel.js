const apiKey = "c1f80921-2d9d-484a-b297-a221cdd62746";
const travelPlan = load("plan");
const routesContainer = document.getElementById("routes");

const routesLocalStorageKey = "routes";

let currentRoutes = [];

document.addEventListener("DOMContentLoaded", () => {
  init();
});

function init() {
  useFetchedRoutes();
  console.log("Travel plan: ", travelPlan);
}

function renderRoutes(routes) {
  routesContainer.innerHTML = "";
  if (routes) {
    routes.forEach((route) => {
      const ul = document.createElement("ul");

      const li = document.createElement("li");
      li.innerText = travelPlan.start;
      ul.appendChild(li);

      route.forEach((leg) => {
        const dest = leg.Destination.name;
        const li = document.createElement("li");
        li.innerText = dest;
        ul.appendChild(li);
        console.log("leg", leg);
      });
      routesContainer.appendChild(ul);
    });
  }
}

async function fetchRoutes(originId, destId) {
  const url = `https://api.resrobot.se/v2.1/trip?format=json&originId=${originId}&destId=${destId}&accessId=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    return [];
  }
}

function assignFetchedRoutes() {
  if (travelPlan) {
    const startID = travelPlan.startExtId;
    const endID = travelPlan.endExtId;
    fetchRoutes(startID, endID).then((routes) => {
      if (routes) {
        currentRoutes = routes.Trip.map((route) => route.LegList.Leg);
        save(routesLocalStorageKey, { routes: currentRoutes, fetchAt: new Date() });
        renderRoutes(currentRoutes);
      }
    });
  }
}

function useFetchedRoutes() {
  const loadRoutes = load(routesLocalStorageKey);
  if (!loadRoutes) {
    assignFetchedRoutes();
    console.log("Data fetched");
  } else {
    const reFetch = compareWithTempDate(new Date(), loadRoutes.fetchAt, 60);
    if (reFetch) {
      assignFetchedRoutes();
      console.log("Routes refetched");
    } else {
      currentRoutes = loadRoutes.routes;
      setTimeout(() => {
        console.log("Routes loaded: ", currentRoutes);
        renderRoutes(currentRoutes);
      }, 100);
    }
  }
}

function compareWithTempDate(date1, date2, timeLimitInSeconds) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const tempDate = new Date(d2);
  tempDate.setSeconds(tempDate.getSeconds() + timeLimitInSeconds);

  return d1 > tempDate;
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
