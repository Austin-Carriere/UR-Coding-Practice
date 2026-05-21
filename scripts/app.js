//----------------------------------Code Sections-----------------------------

const MovementSectionButton = document.getElementById("MovementSectionbutton");
const LogicSectionButton = document.getElementById("LogicSectionbutton");
const OperatorsSectionButton = document.getElementById(
  "OperatorsSectionbutton",
);
const LoopsSectionButton = document.getElementById("LoopsSectionbutton");
const SensorsSectionbutton = document.getElementById("SensorsSectionbutton");

const codeSection = document.getElementById("codesections");

const blockBank = document.getElementById("blockBank");
const blockBankTitle = document.getElementById("blockBankTitle");
const blockBankContent = document.getElementById("blockBankContent");

const canvas = document.getElementById("canvas");

let selectedSec = false;

let sectionSelected = new Map();

sectionSelected.set(MovementSectionButton, 0);
sectionSelected.set(LogicSectionButton, 0);
sectionSelected.set(OperatorsSectionButton, 0);
sectionSelected.set(LoopsSectionButton, 0);
sectionSelected.set(SensorsSectionbutton, 0);

//----------------------------------Section Lists-----------------------------

let movementList = [];
let logicList = [];
let operatorsList = [];
let loopsList = [];
let sensorsList = [];

function sectionToList(section) {
  if (section === MovementSectionButton) {
    return movementList;
  } else if (section === LogicSectionButton) {
    return logicList;
  } else if (section === OperatorsSectionButton) {
    return operatorsList;
  } else if (section === LoopsSectionButton) {
    return loopsList;
  } else if (section === SensorsSectionbutton) {
    return sensorsList;
  }
}

//----------------------------------Section Buttons-----------------------------

MovementSectionButton.addEventListener("click", () => {
  selectSection(
    MovementSectionButton,
    "#e6af2e",
    MovementSectionButton.textContent,
  );
});

LogicSectionButton.addEventListener("click", () => {
  selectSection(LogicSectionButton, "#5e0eff", LogicSectionButton.textContent);
});

OperatorsSectionButton.addEventListener("click", () => {
  selectSection(
    OperatorsSectionButton,
    "#ff0e0e",
    OperatorsSectionButton.textContent,
  );
});

LoopsSectionButton.addEventListener("click", () => {
  selectSection(LoopsSectionButton, "#41e401", LoopsSectionButton.textContent);
});

SensorsSectionbutton.addEventListener("click", () => {
  selectSection(
    SensorsSectionbutton,
    "#FF0EEF",
    SensorsSectionbutton.textContent,
  );
});

//----------------------------------Select Section-----------------------------

function selectSection(button, color, title) {
  if (sectionSelected.get(button) === 1) {
    sectionSelected.forEach((value, key) => {
      sectionSelected.set(key, 0);
    });

    selectedSec = false;

    blockBank.classList.remove("active");

    sectionsButtonUpdate();

    return;
  }

  sectionSelected.forEach((value, key) => {
    sectionSelected.set(key, 0);
  });

  sectionSelected.set(button, 1);

  selectedSec = true;

  blockBankTitle.textContent = title;
  blockBankTitle.style.color = color;

  openToolBox(button);

  sectionsButtonUpdate();
}

//----------------------------------Update UI-----------------------------

function sectionsButtonUpdate() {
  sectionSelected.forEach((selected, element) => {
    if (selected === 1) {
      element.style.borderRight = "4px #f5d061 solid";
    } else {
      element.style.borderRight = "";
    }

    if (selectedSec) {
      element.style.fontSize = "13px";
      element.style.textAlign = "center";
      element.style.paddingLeft = "2px";
    } else {
      element.style.fontSize = "";
      element.style.textAlign = "";
      element.style.paddingLeft = "";
    }
  });

  if (selectedSec) {
    codeSection.style.width = "65px";
    codeSection.style.maxWidth = "35%";

    blockBank.classList.add("active");
  } else {
    codeSection.style.width = "";
    codeSection.style.maxWidth = "";

    blockBank.classList.remove("active");
  }
}

//----------------------------------Open Toolbox-----------------------------

function openToolBox(section) {
  blockBankContent.innerHTML = "";

  let list = [];

  if (section === MovementSectionButton) {
    list = movementList;
  } else if (section === LogicSectionButton) {
    list = logicList;
  } else if (section === OperatorsSectionButton) {
    list = operatorsList;
  } else if (section === LoopsSectionButton) {
    list = loopsList;
  } else if (section === SensorsSectionbutton) {
    list = sensorsList;
  }

  list.forEach((block) => {
    block.render(blockBankContent);
  });
}

//----------------------------------Block Class-----------------------------

let blocks = new Array();
let highestBlockLayer = 1;

class Block {
  constructor(
    text,
    section,
    hasSelectionBox,
    hasInput,
    x = 0,
    y = 0,
    isTemplate = false,
    options = new Map(),
    type = "basic",
    acceptor = 0, //0 = none, 1 = int acceptor, 2 = boolean acceptor
  ) {
    this.text = text;
    this.selected = false;

    this.type = type;

    this.section = section;

    this.hasInput = hasInput;
    this.hasSelectionBox = hasSelectionBox;

    this.options = options;

    this.x = x;
    this.y = y;

    this.isTemplate = isTemplate;

    if (this.type === "basic") {
      acceptor = 0;
    }
    this.acceptor = acceptor;

    this.element = this.createElement();

    if (!this.isTemplate) {
      this.render(canvas);
    } else {
      this.element.classList.add("template");
    }
  }

  copyData() {
    return {
      text: this.text,
      section: this.section,
      hasSelectionBox: this.hasSelectionBox,
      hasInput: this.hasInput,
      options: this.options,
      type: this.type,
      acceptor: this.acceptor,
      inputValue: this.input ? this.input.value : "",
      selectionValue: this.selectionBox ? this.selectionBox.value : "",
      x: this.x,
      y: this.y,
    };
  }

  static getSelectedBlock() {
    return blocks.find((block) => block.selected);
  }

  bringToFront() {
    highestBlockLayer += 1;
    this.element.style.zIndex = highestBlockLayer;
  }

  static paste(copyData) {
    const pastedBlock = new Block(
      copyData.text,
      copyData.section,
      copyData.hasSelectionBox,
      copyData.hasInput,
      copyData.x + 20,
      copyData.y + 20,
      false,
      copyData.options,
      copyData.type,
      copyData.acceptor,
    );

    pastedBlock.bringToFront();

    if (pastedBlock.input) {
      pastedBlock.input.value = copyData.inputValue;
    }

    if (pastedBlock.selectionBox) {
      pastedBlock.selectionBox.value = copyData.selectionValue;
    }

    Block.deselect();
    pastedBlock.selected = true;

    return pastedBlock;
  }

  delete() {
    this.element.classList.add("delete");

    this.element.addEventListener(
      "animationend",
      () => {
        this.element.remove();

        const index = blocks.indexOf(this);

        if (index !== -1) {
          blocks.splice(index, 1);
        }
      },
      { once: true },
    );
  }

  static deselect() {
    blocks.forEach((block) => {
      if (block.selected) {
        block.selected = false;
      }
    });
  }

  createElement() {
    //basic = blockTemplate
    //surrondBlock = surrondBlock
    let template;

    if (this.type === "basic") {
      template = document.getElementById("blockTemplate");
    } else if (this.type === "surround") {
      template = document.getElementById("surrondBlock");
    } else {
      console.error("NO BLOCK TYPE FOUND");
      template = document.getElementById("blockTemplate");
    }

    const block = template.content
      .cloneNode(true)
      .querySelector("#Base-Code-Shape");

    const title1 = block.querySelector("#title1");
    const title2 = block.querySelector("#title2");

    const pathObject = block.querySelector("#pathObject");
    this.pathObject = pathObject;

    const input = block.querySelector(".blockInput");
    const selectionBox = block.querySelector(".blockSelectionBox");
    const intAcceptor = block.querySelector(".intacceptor");
    this.input = input;
    this.selectionBox = selectionBox;
    this.intAcceptor = intAcceptor;

    if (selectionBox) {
      selectionBox.addEventListener("mousedown", (event) => {
        event.stopPropagation();
      });
    }

    //----------------------------------Text-----------------------------

    let textSplit = this.text.split("/");

    title1.textContent = textSplit[0] || "";
    title2.textContent = textSplit[1] || "";

    //----------------------------------Input-----------------------------

    if (!this.hasSelectionBox && selectionBox) {
      selectionBox.style.display = "none";
    } else if (selectionBox) {
      this.options.forEach((value, key) => {
        selectionBox.add(new Option(key, value));
      });
    }

    if (!this.hasInput && input) {
      input.style.display = "none";
    }

    if (intAcceptor && this.acceptor !== 1) {
      intAcceptor.style.display = "none";
    }

    //----------------------------------Position-----------------------------

    if (this.isTemplate) {
      block.style.position = "relative";
    } else {
      block.style.position = "absolute";
      blocks.push(this);
      block.style.left = this.x + "px";
      block.style.top = this.y + "px";
      block.style.zIndex = highestBlockLayer;
    }

    //----------------------------------Section Colors-----------------------------

    if (this.section === "move") {
      if (pathObject) {
        pathObject.setAttribute("fill", "#f7e030");
        pathObject.setAttribute("stroke", "#e0cb27");
      }

      if (this.hasSelectionBox) {
        selectionBox.style.backgroundColor = "#d4bf24";
      }

      if (this.isTemplate) {
        movementList.push(this);
      }
    } else if (this.section === "logic") {
      if (pathObject) {
        pathObject.setAttribute("fill", "#2200ff");
        pathObject.setAttribute("stroke", "#5e0eff");
      }

      if (this.hasSelectionBox) {
        selectionBox.style.backgroundColor = "#5e0eff";
      }

      title1.style.color = "rgb(219, 203, 255)";
      title2.style.color = "rgb(219, 203, 255)";

      if (this.isTemplate) {
        logicList.push(this);
      }
    } else if (this.section === "oper") {
      if (pathObject) {
        pathObject.setAttribute("fill", "#ff0e0e");
        pathObject.setAttribute("stroke", "#d90d0d");
      }

      if (this.hasSelectionBox) {
        selectionBox.style.backgroundColor = "#d50b0b";
      }

      if (this.isTemplate) {
        operatorsList.push(this);
      }
    } else if (this.section === "loop") {
      if (pathObject) {
        pathObject.setAttribute("fill", "#12ff0e");
        pathObject.setAttribute("stroke", "#10cd10");
      }

      if (this.hasSelectionBox) {
        selectionBox.style.backgroundColor = "#0ed50e";
      }

      if (this.isTemplate) {
        loopsList.push(this);
      }
    } else if (this.section === "sens") {
      if (pathObject) {
        pathObject.setAttribute("fill", "#ff0eef");
        pathObject.setAttribute("stroke", "#df1ad2");
      }

      if (this.hasSelectionBox) {
        selectionBox.style.backgroundColor = "#d50ec8";
      }

      if (this.isTemplate) {
        sensorsList.push(this);
      }
    } else {
      console.error("NO SECTION FOUND");
    }

    //----------------------------------Spawn Workspace Block-----------------------------

    //---------------------------------Block-Dragging----------------------

    this.isDragging = false;

    this.offsetX = 0;
    this.offsetY = 0;

    block.addEventListener("mousedown", (event) => {
      // TEMPLATE BLOCKS
      if (this.isTemplate) {
        const canvasRect = canvas.getBoundingClientRect();

        const newBlock = new Block(
          this.text,
          this.section,
          this.hasSelectionBox,
          this.hasInput,

          event.clientX -
            canvasRect.left -
            this.element.getBoundingClientRect().width / 2,
          event.clientY -
            canvasRect.top -
            this.element.getBoundingClientRect().height / 2,

          false,
          this.options,
          this.type,
          this.acceptor,
        );

        newBlock.bringToFront();

        // immediately drag new block
        newBlock.isDragging = true;

        const rect = newBlock.element.getBoundingClientRect();

        newBlock.offsetX = event.clientX - rect.left;
        newBlock.offsetY = event.clientY - rect.top;

        return;
      } else {
        event.stopPropagation();
        Block.deselect();

        this.selected = true;
      }

      // WORKSPACE BLOCKS
      this.bringToFront();
      this.isDragging = true;

      const rect = block.getBoundingClientRect();

      this.offsetX = event.clientX - rect.left;
      this.offsetY = event.clientY - rect.top;
    });

    document.addEventListener("mousemove", (event) => {
      if (!this.isDragging) return;

      const canvasRect = canvas.getBoundingClientRect();

      this.x = event.clientX - canvasRect.left - this.offsetX;
      this.y = event.clientY - canvasRect.top - this.offsetY;

      block.style.left = this.x + "px";
      block.style.top = this.y + "px";
      console.log(this.x + " " + this.y);
    });

    document.addEventListener("mouseup", () => {
      this.isDragging = false;
      if (
        this.x < -10 ||
        this.y < -10 ||
        this.y > canvas.getBoundingClientRect().height * 0.92 ||
        this.x > canvas.getBoundingClientRect().width * 0.79
      ) {
        this.delete();
      }
    });
    return block;
  }

  render(parent) {
    parent.appendChild(this.element);
  }
}

document.addEventListener("mousedown", () => {
  Block.deselect();
});

//NEED to change for copying multiple

let savedBlockData;

document.addEventListener("keydown", (event) => {
  const activeElement = document.activeElement;
  const isTyping =
    activeElement.tagName === "INPUT" || activeElement.tagName === "SELECT";

  if (event.key === "Delete" || event.key === "Backspace") {
    if (isTyping) return;

    blocks.forEach((block) => {
      if (block.selected) {
        block.delete();
      }
    });
  }

  if (event.code === "KeyC" && event.ctrlKey) {
    const selectedBlock = Block.getSelectedBlock();

    if (selectedBlock) {
      event.preventDefault();
      savedBlockData = selectedBlock.copyData();
    }
  }

  if (event.code === "KeyV" && event.ctrlKey) {
    if (savedBlockData) {
      event.preventDefault();
      savedBlockData = Block.paste(savedBlockData).copyData();
    }
  }
});

//----------------------------------Create Template Blocks-----------------------------

//For option list it is a Map with (NAME, value); const myMap = new Map([[1, "one"],[2, "two"],[3, "three"], ]);

new Block(
  "Move/seconds",
  "move",
  true,
  true,
  0,
  0,
  true,
  new Map([
    ["forward", "forward"],
    ["backward", "backward"],
  ]),
  "basic",
  0,
);

new Block(
  "Turn/degrees",
  "move",
  false,
  true,
  0,
  0,
  true,
  new Map(),
  "basic",
  0,
);

new Block("If", "logic", false, false, 0, 0, true, new Map(), "surround", 1);

new Block("Equals", "oper", false, true, 0, 0, true, new Map(), "basic", 0);

new Block(
  "Repeat/Times",
  "loop",
  false,
  true,
  0,
  0,
  true,
  new Map(),
  "surround",
  0,
);

new Block("Touching?", "sens", false, false, 0, 0, true, new Map(), "basic", 0);
