const apiKey = "c1f80921-2d9d-484a-b297-a221cdd62746";
const travelPlan = load("plan");
const routesContainer = document.getElementById("routes");
const routeLocalStorageKey = "route";
const startPagePath = "index.html";

let currentLocalStorageKey;

let startExtId;
let endExtId;
let startName;

let currentRoutes = [];

document.addEventListener("DOMContentLoaded", () => {
  init();
});

function init() {
  loadTravelPlanValues();
  useFetchedRoutes();
  console.log("Travel plan: ", travelPlan);
}

function loadTravelPlanValues() {
  if (travelPlan) {
    startExtId = travelPlan.startExtId;
    endExtId = travelPlan.endExtId;
    startName = travelPlan.start;
    currentLocalStorageKey = `${routeLocalStorageKey}${startExtId}${endExtId}`;
  }
}

function renderRoutes(routes) {
  routesContainer.innerHTML = "";
  if (routes) {
    routes.forEach((route) => {
      const li = document.createElement("li");
      const contentContainer = document.createElement("div");
      const routeHeading = document.createElement("div");

      const routeInfoContainer = document.createElement("div");
      const destContainer = document.createElement("div");
      const routeChangesContainer = document.createElement("div");
      const buyTicketBtn = document.createElement("button");

      const routeHeader = document.createElement("h2");
      const travelTimeContainer = document.createElement("div");
      const travelTime = document.createElement("p");
      const travelDuration = document.createElement("p");

      contentContainer.setAttribute("class", "contentContainer");
      routeHeading.setAttribute("class", "routeHeading");
      routeInfoContainer.setAttribute("class", "routeInfoContainer");
      destContainer.setAttribute("class", "destContainer");
      routeChangesContainer.setAttribute("class", "routeChangesContainer");

      let startTime;
      let endTime;

      if (route) {
        if (route.length <= 1) {
          const routeData = route[0];
          startTime = routeData.Origin.time;
          endTime = routeData.Destination.time;
        } else {
          const routeStartData = route[0];
          const routeEndData = route[route.length - 1];
          startTime = routeStartData.Origin.time;
          endTime = routeEndData.Destination.time;
        }
      }

      routeHeader.innerText = startName;
      travelTimeContainer.setAttribute("class", "travelTimeContainer");
      if (startTime && endTime) {
        const extractedStartTime = extractTravelTime(travelTime, startTime, endTime).startTime;
        const extractedEndTime = extractTravelTime(travelTime, startTime, endTime).endTime;
        const extractedDuration = timeDifference(extractedStartTime, extractedEndTime);

        travelTime.innerText = `${extractedStartTime} - ${extractedEndTime}`;
        travelDuration.innerText = extractedDuration;
      }

      travelDuration.setAttribute("class", "badge badgePrimary");

      routeHeading.appendChild(routeHeader);
      travelTimeContainer.appendChild(travelTime);
      travelTimeContainer.appendChild(travelDuration);
      routeHeading.appendChild(travelTimeContainer);

      renderRouteOrder(destContainer, route, travelPlan.start);
      renderRouteOrder(routeChangesContainer, route, 1);

      buyTicketBtn.innerText = "Köp biljett";
      buyTicketBtn.setAttribute("class", "btn btnPrimary");
      buyTicketBtn.addEventListener("click", () => {
        if (startTime && endTime) {
          let ticketLocalStorageKey = `ticket${currentLocalStorageKey}${startTime}${endTime}`;
          save(ticketLocalStorageKey, { route: route, boughtAt: new Date() });
          setTimeout(() => {
            redriect(startPagePath);
          }, 100);
        }
      });

      route.forEach((leg) => {
        const dest = leg.Destination.name;
        renderRouteOrder(destContainer, route, dest);
        renderRouteOrder(routeChangesContainer, route, 1);
      });

      routeInfoContainer.appendChild(destContainer);
      routeInfoContainer.appendChild(routeChangesContainer);
      routesContainer.appendChild(routeInfoContainer);
      contentContainer.appendChild(routeHeading);
      contentContainer.appendChild(routeInfoContainer);
      contentContainer.appendChild(buyTicketBtn);
      li.appendChild(contentContainer);
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
        save(currentLocalStorageKey, { routes: currentRoutes, fetchAt: new Date() });
        renderRoutes(currentRoutes);
      }
    });
  }
}

function useFetchedRoutes() {
  const loadRoutes = load(currentLocalStorageKey);
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

function extractTravelTime(element, start, end) {
  if (start && end) {
    const startTimeParts = start.split(":");
    const startTime = `${startTimeParts[0]}:${startTimeParts[1]}`;

    const endTimeParts = end.split(":");
    const endTime = `${endTimeParts[0]}:${endTimeParts[1]}`;
    return {
      startTime: startTime,
      endTime: endTime,
    };
  } else {
    element.setAttribute("class", "hidden");
    return "";
  }
}

function timeDifference(start, end) {
  const startTime = new Date(`1970-01-01T${start}:00`);
  const endTime = new Date(`1970-01-01T${end}:00`);

  const diffInMs = endTime - startTime;

  if (diffInMs < 0) {
    return "";
  }

  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

  let result = "";
  if (hours > 0) {
    result += `${hours}h`;
  }
  if (minutes > 0) {
    result += (result ? " " : "") + `${minutes}min`;
  }
  return result || "";
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
