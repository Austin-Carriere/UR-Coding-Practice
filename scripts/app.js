//----------------------------------Code Sections-----------------------------

const MovementSectionButton = document.getElementById("MovementSectionbutton");
const LogicSectionButton = document.getElementById("LogicSectionbutton");
const OperatorsSectionButton = document.getElementById(
  "OperatorsSectionbutton",
);
const LoopsSectionButton = document.getElementById("LoopsSectionbutton");
const codeSection = document.getElementById("codesections");

let selectedSec = false;
let sectionSelected = new Map();
sectionSelected.set(MovementSectionButton, 0);
sectionSelected.set(LogicSectionButton, 0);
sectionSelected.set(OperatorsSectionButton, 0);
sectionSelected.set(LoopsSectionButton, 0);

const originalText = new Map();

sectionSelected.forEach((selected, element) => {
  originalText.set(element, element.textContent);
});

MovementSectionButton.addEventListener("click", () => {
  if (sectionSelected.get(MovementSectionButton) === 1) {
    sectionSelected.forEach((value, key) => {
      sectionSelected.set(key, 0);
    });
    selectedSec = false;
  } else {
    sectionSelected.forEach((value, key) => {
      sectionSelected.set(key, 0);
      sectionSelected.set(MovementSectionButton, 1);
      selectedSec = true;
    });
  }
});

LogicSectionButton.addEventListener("click", () => {
  if (sectionSelected.get(LogicSectionButton) === 1) {
    sectionSelected.forEach((value, key) => {
      sectionSelected.set(key, 0);
    });
    selectedSec = false;
  } else {
    sectionSelected.forEach((value, key) => {
      sectionSelected.set(key, 0);
      sectionSelected.set(LogicSectionButton, 1);
      selectedSec = true;
    });
  }
});

OperatorsSectionButton.addEventListener("click", () => {
  if (sectionSelected.get(OperatorsSectionButton) === 1) {
    sectionSelected.forEach((value, key) => {
      sectionSelected.set(key, 0);
    });
    selectedSec = false;
  } else {
    sectionSelected.forEach((value, key) => {
      sectionSelected.set(key, 0);
      sectionSelected.set(OperatorsSectionButton, 1);
      selectedSec = true;
    });
  }
});

LoopsSectionButton.addEventListener("click", () => {
  if (sectionSelected.get(LoopsSectionButton) === 1) {
    sectionSelected.forEach((value, key) => {
      sectionSelected.set(key, 0);
    });
    selectedSec = false;
  } else {
    sectionSelected.forEach((value, key) => {
      sectionSelected.set(key, 0);
      sectionSelected.set(LoopsSectionButton, 1);
      selectedSec = true;
    });
  }
});

function sectionsButtonUpdate() {
  sectionSelected.forEach((selected, element) => {
    if (selected === 1) {
      element.style.borderRight = "4px #f5d061 solid";
    } else {
      element.style.borderRight = "";
    }
  });
  if (selectedSec === true) {
    codeSection.style.width = "10%";
    sectionSelected.forEach((selected, element) => {
      element.textContent = "";
    });
  } else {
    codeSection.style.width = "";

    sectionSelected.forEach((selected, element) => {
      element.textContent = originalText.get(element);
    });
  }
}

function loop() {
  sectionsButtonUpdate();
  requestAnimationFrame(loop);
}

loop();
