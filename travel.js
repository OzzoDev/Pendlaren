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
      const li = document.createElement("li");
      const routeInfoContainer = document.createElement("div");
      const destContainer = document.createElement("div");
      const routeChangesContainer = document.createElement("div");
      const buyTicketBtn = document.createElement("button");
      routeInfoContainer.setAttribute("class", "routeInfoContainer");
      destContainer.setAttribute("class", "destContainer");
      routeChangesContainer.setAttribute("class", "routeChangesContainer");

      // const origin = document.createElement("p");
      // origin.innerText = travelPlan.start;
      // destContainer.appendChild(origin);

      renderRouteOrder(destContainer, route, travelPlan.start);
      renderRouteOrder(routeChangesContainer, route, 1);

      buyTicketBtn.innerText = "Köp biljett";
      buyTicketBtn.setAttribute("class", "btn btnPrimary");

      route.forEach((leg) => {
        const dest = leg.Destination.name;
        // const destionation = document.createElement("p");
        // destionation.innerText = dest;
        // destContainer.appendChild(destionation);
        renderRouteOrder(destContainer, route, dest);

        renderRouteOrder(routeChangesContainer, route, 1);
        console.log("leg", leg);
      });
      routeInfoContainer.appendChild(destContainer);
      routeInfoContainer.appendChild(routeChangesContainer);
      routesContainer.appendChild(routeInfoContainer);
      li.appendChild(routeInfoContainer);
      li.appendChild(buyTicketBtn);
      routesContainer.appendChild(li);
    });
  }
}

function renderRouteOrder(parent, routes, text) {
  const container = document.createElement("div");
  const flag = document.createElement("p");
  let arrowIcon;
  if (parent.children.length < routes.length) {
    arrowIcon = document.createElement("img");
    arrowIcon.setAttribute("src", "/icons/downArrow.svg");
    arrowIcon.setAttribute("alt", "Byte av buss");
    arrowIcon.setAttribute("class", "icon downArrowIcon");
  }

  flag.innerText = text;
  container.appendChild(flag);
  if (arrowIcon) {
    container.appendChild(arrowIcon);
  }
  parent.appendChild(container);
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
