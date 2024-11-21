const ticketsContainer = document.getElementById("tickets");
const travelPlan = load("plan");
const routeLocalStorageKey = "route";

const startPagePath = "index.html";

let startExtId;
let endExtId;
let startName;

window.addEventListener("DOMContentLoaded", () => {
  init();
});

function init() {
  loadTravelPlanValues();
  const tickets = getTickets();
  const ticketRoutes = tickets.map((ticket) => ({ ticket: ticket.value.route, boughtAt: ticket.value.boughtAt }));

  const sortedTickets = ticketRoutes.sort((a, b) => new Date(b.boughtAt) - new Date(a.boughtAt));

  renderTickets(sortedTickets);
  startTimer(tickets);
  rerenderTicktes(sortedTickets);
}

function loadTravelPlanValues() {
  if (travelPlan) {
    startExtId = travelPlan.startExtId;
    endExtId = travelPlan.endExtId;
    startName = travelPlan.start;
    currentLocalStorageKey = `${routeLocalStorageKey}${startExtId}${endExtId}`;
  }
}

function removeUsedTicket(expiredTicket, tickets) {
  const validTickets = tickets.filter((ticket) => ticket !== expiredTicket);
  const ticketsToRender = validTickets.map((ticket) => ({ ticket: ticket.value.route, boughtAt: ticket.value.boughtAt })).sort((a, b) => new Date(b.boughtAt) - new Date(a.boughtAt));
  renderTickets(ticketsToRender);
}

function startTimer(tickets) {
  checkTickets(tickets);

  setInterval(() => {
    checkTickets(tickets);
  }, 60000);
}

function rerenderTicktes(tickets) {
  setInterval(() => {
    renderTickets(tickets);
  }, 60000);
}

function checkTickets(tickets) {
  tickets.forEach((ticket) => {
    if (ticketHasExpired(ticket.value.boughtAt, new Date())) {
      remove(ticket.key);
      removeUsedTicket(ticket, tickets);
    }
  });
}

function ticketHasExpired(date1, date2) {
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  const diffInMs = Math.abs(secondDate - firstDate);
  const diffInHours = diffInMs / (1000 * 60 * 60);

  return diffInHours > 1;
}

function renderTickets(tickets) {
  ticketsContainer.innerHTML = "";
  if (tickets) {
    tickets.forEach((ticket) => {
      const li = document.createElement("li");
      const contentContainer = document.createElement("div");
      const routeHeading = document.createElement("div");

      const routeInfoContainer = document.createElement("div");
      const destContainer = document.createElement("div");
      const routeChangesContainer = document.createElement("div");
      const timeLeft = document.createElement("p");

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
      if (ticket.ticket) {
        if (ticket.ticket.length <= 1) {
          const routeData = ticket.ticket[0];
          startTime = routeData.Origin.time;
          endTime = routeData.Destination.time;
        } else {
          const routeStartData = ticket.ticket[0];
          const routeEndData = ticket.ticket[ticket.ticket.length - 1];
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

      const dirFlag = ticket.ticket.find((flag) => flag.directionFlag).directionFlag;

      renderRouteOrder(destContainer, ticket.ticket, travelPlan.start);

      renderRouteOrder(routeChangesContainer, ticket.ticket, dirFlag);

      timeLeft.setAttribute("class", "ticketDuration badge");
      timeLeft.innerText = `Giltig i ${getRemainingTime(ticket.boughtAt, new Date())}`;

      ticket.ticket.forEach((leg) => {
        const dest = leg.Destination.name;
        renderRouteOrder(destContainer, ticket.ticket, removeFirstWord(dest));
        renderRouteOrder(routeChangesContainer, ticket.ticket, dirFlag);
      });

      routeInfoContainer.appendChild(destContainer);
      routeInfoContainer.appendChild(routeChangesContainer);
      contentContainer.appendChild(routeHeading);
      contentContainer.appendChild(routeInfoContainer);
      contentContainer.appendChild(timeLeft);
      li.appendChild(contentContainer);
      ticketsContainer.appendChild(li);
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

function removeFirstWord(str) {
  const wordToUse = str.split(" ");
  return wordToUse.slice(1).join(" ");
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

function getRemainingTime(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffInMs = end - start;

  if (diffInMs <= 0) {
    return "0min";
  }

  const oneHour = 60;
  const totalMinutes = oneHour - Math.floor(diffInMs / (1000 * 60));

  if (totalMinutes < 60) {
    return `${totalMinutes}min`;
  }

  const hours = `${Math.floor(totalMinutes / 60) === 0 ? "" : Math.floor(totalMinutes / 60) + "h"}`;
  const minutes = `${totalMinutes % 60 === 0 ? "" : (totalMinutes % 60) + "min"}`;

  return `${hours} ${minutes}`;
}

function getTickets() {
  const ticketKeys = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("ticket")) {
      ticketKeys.push({ value: load(key), key: key });
    }
  }
  return ticketKeys;
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

function remove(key) {
  localStorage.removeItem(key);
}
