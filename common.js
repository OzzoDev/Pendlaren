const indexPath = "index.html";

window.addEventListener("DOMContentLoaded", () => {
  initBackBtn();
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

function redriect(path) {
  window.location.href = path;
}
