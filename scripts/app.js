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
let blockStyleScopeId = 0;

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
    type,
    acceptor = 0, //0 = none, 1 = int acceptor, 2 = boolean acceptor
  ) {
    this.text = text;
    this.selected = false;

    this.type = type;
    this.child = null;

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

  resizeToFitContent() {
    if (!this.foreignObject || !this.pathObject) return;

    this.resizeInputToFitContent();

    const svgRect = this.element.getBoundingClientRect();
    if (svgRect.width === 0) return;

    if (!this.baseRenderedWidth) {
      this.baseRenderedWidth = svgRect.width;
      this.baseRenderedHeight = svgRect.height;
      this.renderScale = this.baseRenderedWidth / this.baseViewBoxWidth;
    }

    const visibleChildren = Array.from(this.foreignObject.children).filter(
      (child) =>
        child.tagName.toLowerCase() !== "style" &&
        getComputedStyle(child).display !== "none",
    );

    const contentRight = visibleChildren.reduce((right, child) => {
      return Math.max(right, child.getBoundingClientRect().right);
    }, svgRect.left);

    const desiredRenderedWidth = Math.max(
      this.baseRenderedWidth,
      contentRight - svgRect.left + 24,
    );

    const expandedWidth = desiredRenderedWidth / this.renderScale;

    if (Math.abs(desiredRenderedWidth - svgRect.width) <= 1) return;

    this.element.style.maxWidth = "none";
    this.element.style.width = desiredRenderedWidth + "px";
    this.element.style.height = this.baseRenderedHeight + "px";

    if (this.type === "surround") {
      this.element.style.overflow = "visible";
      this.element.setAttribute("preserveAspectRatio", "xMinYMin meet");
      this.resizeSurroundPath(expandedWidth);
    } else {
      this.resizeBasicPath(expandedWidth);
    }
  }

  resizeInputToFitContent() {
    if (!this.input || !this.hasInput) return;

    this.input.style.width = "1ch";
    this.input.style.width = this.input.scrollWidth + "px";
  }

  resizeBasicPath(expandedWidth) {
    const rightEdgeStart = expandedWidth - 20;

    this.element.setAttribute("viewBox", `0 0 ${expandedWidth} 95.31`);
    this.pathObject.setAttribute(
      "d",
      `M${rightEdgeStart},2H82.4v6.51l-23.4,13.51-23.4-13.51V2h-15.6C10.06,2,2,10.06,2,20v36c0,9.94,8.06,18,18,18h15.6v6.51l23.4,13.51,23.4-13.51v-6.51H${rightEdgeStart}c9.94,0,18-8.06,18-18V20c0-9.94-8.06-18-18-18Z`,
    );
  }

  resizeSurroundPath(expandedWidth) {
    const extraWidth = expandedWidth - this.baseViewBoxWidth;
    const topRightStart = 302.65 + extraWidth;
    const bottomRightEdge = 313.12 + extraWidth;
    const topBridgeLength = 144.94 + extraWidth;

    this.element.setAttribute("viewBox", "-2 -2 327.42 197.4312");
    this.pathObject.setAttribute(
      "d",
      `M${topRightStart},0H80.64l.06,7.11-23.26,13.68-23.48-13.3-.06-7.48h-15.55C8.21,0,0,8.21,0,18.35v135.06c0,11.05,8.95,20,20,20h14.01l.06,6.84,23.48,13.3,23.26-13.68-.05-6.47H${bottomRightEdge}v-30.52H157.66v7.64l-23.37,13.49-23.37-13.49v-7.64h-47.98l-5.72-3.24v-67.65h53.75l.05,6.48,23.48,13.3,23.26-13.68-.05-6.1h${topBridgeLength}c10.13,0,18.35-8.21,18.35-18.35V18.35c0-10.13-8.21-18.35-18.35-18.35Z`,
    );
  }

  attachProximity(distance, block) {
    if (
      Math.abs(this.x - block.x) < distance &&
      Math.abs(
        this.y - (block.y + block.element.getBoundingClientRect().height),
      ) < distance
    ) {
      return true;
    }
    return false;
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
    pastedBlock.applyCopiedValues(copyData);

    Block.deselect();
    pastedBlock.selected = true;
    pastedBlock.removeParent();
    pastedBlock.child = null;
    return pastedBlock;
  }

  applyCopiedValues(copyData) {
    if (this.input) {
      this.input.value = copyData.inputValue;
    }

    if (this.selectionBox) {
      this.selectionBox.value = copyData.selectionValue;
    }

    this.resizeToFitContent();
  }

  delete() {
    this.element.classList.add("delete");

    this.element.addEventListener(
      "animationend",
      () => {
        this.removeParent();
        this.element.remove();

        const index = blocks.indexOf(this);

        this.child = null;
        if (index !== -1) {
          blocks.splice(index, 1);
        }
      },
      { once: true },
    );
  }

  deleteRipple() {
    this.element.classList.add("deleteRipple");

    this.element.addEventListener(
      "animationend",
      () => {
        this.removeParent();
        this.element.remove();
        this.child?.deleteRipple();

        const index = blocks.indexOf(this);

        this.child = null;
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

  removeParent() {
    blocks.forEach((block) => {
      if (block.child === this) {
        block.child = null;
      }
    });
  }

  getParent() {
    return blocks.find((block) => block.child === this);
  }

  repostion(parent) {
    console.log("repositioning" + this);
    if (parent && parent.type === "basic") {
      this.x = parent.x;
      this.y = parent.y + parent.element.getBoundingClientRect().height * 0.7;
      this.element.style.left = this.x + "px";
      this.element.style.top = this.y + "px";
    } else if (parent && parent.type === "surround") {
      this.x = parent.x;
      this.y = parent.y + parent.element.getBoundingClientRect().height * 0.87;
      this.element.style.left = this.x + "px";
      this.element.style.top = this.y + "px";
    } else if (parent && parent.type === "doubleSurround") {
      this.x = parent.x;
      this.y = parent.y + parent.element.getBoundingClientRect().height * 0.93;
      this.element.style.left = this.x + "px";
      this.element.style.top = this.y + "px";
    } else if (parent && parent.type === "startBlock") {
      this.x = parent.x * 1;
      this.y = parent.y + parent.element.getBoundingClientRect().height * 0.76;
      this.element.style.left = this.x + "px";
      this.element.style.top = this.y + "px";
    }

    this.child?.repostion(this);
  }

  applyToAllChildren(func) {
    if (this.child) {
      func(this.child);
      this.child.applyToAllChildren(func);
    }
  }

  scopeForeignObjectStyles() {
    if (!this.foreignObject) return;

    blockStyleScopeId += 1;
    const scopeClass = "block-style-scope-" + blockStyleScopeId;
    this.foreignObject.classList.add(scopeClass);

    this.foreignObject.querySelectorAll("style").forEach((style) => {
      style.textContent = style.textContent.replace(
        /(^|})([^{}]+){/g,
        (match, brace, selectorGroup) => {
          const scopedSelectors = selectorGroup
            .split(",")
            .map((selector) => selector.trim())
            .filter(Boolean)
            .map((selector) => {
              if (selector.startsWith("@")) {
                return selector;
              }

              return "." + scopeClass + " " + selector;
            })
            .join(", ");

          return brace + scopedSelectors + " {";
        },
      );
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
    } else if (this.type === "doubleSurround") {
      template = document.getElementById("doubleSurrondBlock");
    } else if (this.type === "startBlock") {
      template = document.getElementById("startBlock");
    } else if (this.type === "int") {
      template = document.getElementById("intBlock");
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
    this.foreignObject = block.querySelector("foreignObject");
    this.scopeForeignObjectStyles();

    if (this.type === "surround") {
      this.baseViewBoxWidth = 327.42;
      this.baseViewBoxHeight = 197.4312;
    } else {
      this.baseViewBoxWidth = 325;
      this.baseViewBoxHeight = 95.31;
    }

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

      selectionBox.addEventListener("change", () => {
        this.resizeToFitContent();
      });
    }

    if (input) {
      input.addEventListener("mousedown", (event) => {
        event.stopPropagation();
      });

      input.addEventListener("input", () => {
        this.resizeToFitContent();
      });
    }

    //----------------------------------Text-----------------------------

    let textSplit = this.text.split("/");
    if (title1 !== null && title2 !== null) {
      title1.textContent = textSplit[0] || "";
      title2.textContent = textSplit[1] || "";
    } else {
      console.log("No text to display");
    }

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
        pathObject.setAttribute("stroke", "#000000");
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
        pathObject.setAttribute("stroke", "#000000");
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
        pathObject.setAttribute("stroke", "#000000");
      }

      if (this.hasSelectionBox) {
        selectionBox.style.backgroundColor = "#d50b0b";
      }

      if (this.isTemplate) {
        operatorsList.push(this);
      }
    } else if (this.section === "loop") {
      if (pathObject) {
        pathObject.setAttribute("fill", "#50e22f");
        pathObject.setAttribute("stroke", "#000000");
      }

      if (this.hasSelectionBox) {
        selectionBox.style.backgroundColor = "#0dfb0d";
      }

      if (this.isTemplate) {
        loopsList.push(this);
      }
    } else if (this.section === "sens") {
      if (pathObject) {
        pathObject.setAttribute("fill", "#ff0eef");
        pathObject.setAttribute("stroke", "#000000");
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
    //---------------------------------Block-Dragging----------------------

    this.isDragging = false;

    this.offsetX = 0;
    this.offsetY = 0;

    block.addEventListener("mousedown", (event) => {
      event.preventDefault();
      this.removeParent();
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
        newBlock.element.classList.add("grabbing");
        newBlock.applyCopiedValues(this.copyData());

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
      if (!this.child) {
        this.bringToFront();
      }

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
      this.child?.repostion(this);
    });

    document.addEventListener("mouseup", () => {
      this.applyToAllChildren((child) => child.bringToFront());
      this.element.classList.remove("grabbing");
      this.isDragging = false;
      if (
        this.x < -10 ||
        this.y < -10 ||
        this.y > canvas.getBoundingClientRect().height * 0.92 ||
        this.x > canvas.getBoundingClientRect().width * 0.79
      ) {
        this.delete();
      }

      if (!this.getParent() || this.type === "startBlock") {
        //So child blocks don't snap to other blocks when they are already snapped to a block
        blocks.forEach((block) => {
          if (
            this.attachProximity(20, block) &&
            block !== this &&
            block.child === null
          ) {
            console.log("snapped");
            if (block.type === "basic") {
              this.x = block.x;
              this.y =
                block.y + block.element.getBoundingClientRect().height * 0.7;
              this.element.style.left = this.x + "px";
              this.element.style.top = this.y + "px";
              this.bringToFront();
              block.child = this;
            } else if (block.type === "surround") {
              this.x = block.x;
              this.y =
                block.y + block.element.getBoundingClientRect().height * 0.87;
              this.element.style.left = this.x + "px";
              this.element.style.top = this.y + "px";
              this.bringToFront();
              block.child = this;
            } else if (block.type === "doubleSurround") {
              this.x = block.x;
              this.y =
                block.y + block.element.getBoundingClientRect().height * 0.93;
              this.element.style.left = this.x + "px";
              this.element.style.top = this.y + "px";
              this.bringToFront();
              block.child = this;
            } else if (block.type === "startBlock") {
              this.x = block.x * 1;
              this.y =
                block.y + block.element.getBoundingClientRect().height * 0.76;
              this.element.style.left = this.x + "px";
              this.element.style.top = this.y + "px";
              this.bringToFront();
              block.child = this;
            }
          }
        });
      }
      this.child?.repostion(this);
    });
    return block;
  }

  render(parent) {
    parent.appendChild(this.element);

    if (this.isTemplate) {
      this.element.style.width = "";
      this.element.style.height = "";
      this.element.style.maxWidth = "";
      this.element.style.overflow = "";
      this.element.removeAttribute("preserveAspectRatio");
      return;
    }

    this.resizeToFitContent();
    requestAnimationFrame(() => {
      this.resizeToFitContent();
    });
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
        block.deleteRipple();
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

// Block Format: new Block(TEXT (use / to separate title 1 and title 2), SECTION, Selectionbox?, NumericalInput?,
//  X, Y, Template? (always true), OPTIONS (MAP), TYPE, ACCEPTOR);
// Just put 0, 0 for x and y. Type: "basic", "surround", WIP. Acceptor: 0 = none, 1 = int acceptor, 2 = boolean acceptor

new Block(
  "If/else",
  "logic",
  false,
  false,
  0,
  0,
  true,
  new Map(),
  "doubleSurround",
  1,
);

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
  "on Play",
  "loop",
  false,
  false,
  0,
  0,
  true,
  new Map(),
  "startBlock",
  0,
);

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
