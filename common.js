const indexPath = "index.html";

window.addEventListener("DOMContentLoaded", () => {
  initBackBtn();
  loadTheme();
  initThemeToggleBtn();
});

function initBackBtn() {
  const navigateBackbtn = document.getElementById("backToIndex");
  if (navigateBackbtn) {
    navigateBackbtn.addEventListener("click", () => {
      console.log("jeje");
      redriect(startPagePath);
    });
  }
}

function initThemeToggleBtn() {
  const themeToggle = document.querySelector(".themeToggle");

  themeToggle.addEventListener("click", () => {
    toggleTheme();
  });
}

function loadTheme() {
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme) {
    applyTheme(currentTheme);
  }
}

function toggleTheme() {
  const currentTheme = localStorage.getItem("theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  console.log("Curr theme: ", newTheme);

  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
}

function applyTheme(theme) {
  const themeToggle = document.querySelector(".themeToggle");

  if (theme === "dark") {
    themeToggle.setAttribute("src", "/icons/sun.svg");
    themeToggle.setAttribute("alt", "Ändra till ljust läge");
    themeToggle.setAttribute("title", "Ändra till ljust läge");
  } else {
    themeToggle.setAttribute("src", "/icons/moon.svg");
    themeToggle.setAttribute("alt", "Ändra till mörkt läge");
    themeToggle.setAttribute("title", "Ändra till mörkt läge");
  }

  document.body.classList.remove("light-mode", "dark-mode");
  document.body.classList.add(theme === "dark" ? "dark-mode" : "light-mode");
}

function redriect(path) {
  window.location.href = path;
}
