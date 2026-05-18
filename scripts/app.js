//----------------------------------Code Sections-----------------------------

const MovementSectionButton = document.getElementById("MovementSectionbutton");
const LogicSectionButton = document.getElementById("LogicSectionbutton");
const OperatorsSectionButton = document.getElementById(
  "OperatorsSectionbutton",
);
const LoopsSectionButton = document.getElementById("LoopsSectionbutton");
const codeSection = document.getElementById("codesections");
const SensorsSectionbutton = document.getElementById("SensorsSectionbutton");
const blockBank = document.getElementById("blockBank");
const blockBankTitle = document.getElementById("blockBankTitle");

let selectedSec = false;
let sectionSelected = new Map();
sectionSelected.set(MovementSectionButton, 0);
sectionSelected.set(LogicSectionButton, 0);
sectionSelected.set(OperatorsSectionButton, 0);
sectionSelected.set(LoopsSectionButton, 0);
sectionSelected.set(SensorsSectionbutton, 0);

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
      blockBankTitle.textContent = MovementSectionButton.textContent;
      blockBankTitle.style.color = "#e6af2e";
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
      blockBankTitle.textContent = LogicSectionButton.textContent;
      blockBankTitle.style.color = "#5e0eff";
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
      blockBankTitle.textContent = OperatorsSectionButton.textContent;
      blockBankTitle.style.color = "#ff0e0e";
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
      blockBankTitle.textContent = LoopsSectionButton.textContent;
      blockBankTitle.style.color = "#4cd516";
    });
  }
});

SensorsSectionbutton.addEventListener("click", () => {
  if (sectionSelected.get(SensorsSectionbutton) === 1) {
    sectionSelected.forEach((value, key) => {
      sectionSelected.set(key, 0);
    });
    selectedSec = false;
  } else {
    sectionSelected.forEach((value, key) => {
      sectionSelected.set(key, 0);
      sectionSelected.set(SensorsSectionbutton, 1);
      selectedSec = true;
      blockBankTitle.textContent = SensorsSectionbutton.textContent;
      blockBankTitle.style.color = "#FF0EEF";
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

    if (selectedSec === true) {
      element.style.fontSize = "13px";
      element.style.textAlign = "center";
      element.style.paddingLeft = "2px";
    } else {
      element.style.fontSize = "";
      element.style.textAlign = "";
    }
  });

  if (selectedSec === true) {
    codeSection.style.width = "65px";
    codeSection.style.maxWidth = "35%";
    blockBank.style.display = "";
  } else {
    codeSection.style.width = "";
    codeSection.style.maxWidth = "";
    blockBank.style.display = "none";
  }
}

function loop() {
  sectionsButtonUpdate();
  requestAnimationFrame(loop);
}

loop();
