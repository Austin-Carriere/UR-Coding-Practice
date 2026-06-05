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
const blockSnapOverlap = 6.5;

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
    acceptor = 0, //0 = none, 1 = boolean acceptor
  ) {
    this.text = text;
    this.selected = false;

    this.type = type;
    this.child = null; // connected block below
    this.parent = null; // connected block above
    this.specialChild = null; // surround and double surround inserted block (only first)
    this.otherChild = null; // the child of the extra surround in double surround
    this.section = section;
    this.inputVariables = []; // for int blocks, store the connected int blocks for each input
    this.parentInput = null;

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
      inputValues: this.inputs ? this.inputs.map((input) => input.value) : [],
      inputValue: this.input ? this.input.value : "",
      selectionValue: this.selectionBox ? this.selectionBox.value : "",
      x: this.x,
      y: this.y,
    };
  }

  resizeToFitContent() {
    if (!this.foreignObject || !this.pathObject) return;
    console.log("resizing", this.text);
    this.resizeInputToFitContent();

    const svgRect = this.element.getBoundingClientRect();
    if (svgRect.width === 0) return;

    if (!this.baseRenderedWidth) {
      this.baseRenderedWidth = svgRect.width;
      this.baseRenderedHeight = svgRect.height;
      this.renderScale = this.baseRenderedWidth / this.baseViewBoxWidth;
    }

    if (this.type === "int") {
      this.resizeIntPath();
      return;
    }

    const visibleChildren = Array.from(
      this.foreignObject.querySelectorAll("*"),
    ).filter(
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

    if (this.type === "surround" || this.type === "doubleSurround") {
      this.element.style.maxWidth = "none";
      this.element.style.width = desiredRenderedWidth + "px";

      if (this.type === "surround") {
        this.horizontalExpandedWidth = expandedWidth;
      }
      this.element.style.overflow = "visible";
      this.element.setAttribute("preserveAspectRatio", "xMinYMin meet");
      this.applySurroundSize();
    } else {
      this.element.style.maxWidth = "none";
      this.element.style.width = desiredRenderedWidth + "px";
      this.element.style.height = this.baseRenderedHeight + "px";
      this.resizeBasicPath(expandedWidth);
    }
  }

  resizeInputToFitContent() {
    if (!this.inputs || !this.hasInput) return;

    this.inputs.forEach((input, index) => {
      const attachedBlock = this.inputVariables[index];

      if (attachedBlock) {
        input.style.width = this.getInputBlockSocketWidth(attachedBlock) + "px";
      } else {
        input.style.width = this.measureInputWidth(input) + "px";
      }

      this.parent?.resizeToFitContent();
    });
  }

  getInputBlockSocketWidth(intBlock) {
    const socketRect = intBlock.pathObject?.getBoundingClientRect();
    const viewBoxWidth =
      this.element.viewBox?.baseVal?.width || this.baseViewBoxWidth;
    const parentScale = viewBoxWidth
      ? this.element.getBoundingClientRect().width / viewBoxWidth
      : this.renderScale;

    return socketRect.width / (parentScale || 1);
  }

  measureInputWidth(input) {
    const style = getComputedStyle(input);
    const canvas =
      Block.inputMeasureCanvas ||
      (Block.inputMeasureCanvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    const text = input.value || input.placeholder || "";
    const padding =
      parseFloat(style.paddingLeft) +
      parseFloat(style.paddingRight) +
      parseFloat(style.borderLeftWidth) +
      parseFloat(style.borderRightWidth);

    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    return Math.max(
      Math.ceil(context.measureText(text).width + padding + 8),
      34,
    );
  }

  resizeBasicPath(expandedWidth) {
    const rightEdgeStart = expandedWidth - 20;

    this.element.setAttribute("viewBox", `0 0 ${expandedWidth} 95.31`);
    this.pathObject.setAttribute(
      "d",
      `M${rightEdgeStart},2H82.4v6.51l-23.4,13.51-23.4-13.51V2h-15.6C10.06,2,2,10.06,2,20v36c0,9.94,8.06,18,18,18h15.6v6.51l23.4,13.51,23.4-13.51v-6.51H${rightEdgeStart}c9.94,0,18-8.06,18-18V20c0-9.94-8.06-18-18-18Z`,
    );
  }

  resizeIntPath() {
    const contentWidth = this.measureIntContentWidth();
    console.log(
      "baseViewBoxWidth",
      this.baseViewBoxWidth,
      "contentWidth",
      contentWidth,
    );
    const width = Math.max(this.baseViewBoxWidth, contentWidth);
    const rect = this.element.querySelector("rect");
    this.element.setAttribute("viewBox", `0 0 ${contentWidth + 36} 46`);
    rect.setAttribute("width", contentWidth + 36);
    this.element.setAttribute("preserveAspectRatio", "xMinYMid meet");
    this.foreignObject.setAttribute("height", "46");
    this.foreignObject.setAttribute("y", "5");
    this.element.style.maxWidth = "none";
    this.element.style.width = Math.pow(contentWidth, 0.919) + 12 + "px";
    this.element.style.height = this.baseRenderedHeight + "px";
  }

  updateInputParentLayout() {
    if (!this.parentInput || !this.parent) return;

    const inputParent = this.parent;
    inputParent.resizeToFitContent();
    this.intReposition();
    inputParent.inputVariables.forEach((intBlock) => {
      intBlock?.intReposition();
    });
    inputParent.parent?.updateConnectedSurrounds();
    inputParent.updateInputParentLayout();
  }

  updateAttachedIntLayout() {
    this.resizeToFitContent();
    this.inputVariables.forEach((intBlock) => {
      intBlock?.intReposition();
    });
    this.updateInputParentLayout();
    this.parent?.updateConnectedSurrounds();
  }

  measureIntContentWidth() {
    const content = this.foreignObject.querySelector(".intBlockContent");
    if (!content) return 0;

    const style = getComputedStyle(content);
    const gap = parseFloat(style.columnGap || style.gap) || 0;
    const padding =
      (parseFloat(style.paddingLeft) || 0) +
      (parseFloat(style.paddingRight) || 0);
    const children = Array.from(content.children).filter(
      (child) => getComputedStyle(child).display !== "none",
    );

    let childrenWidth = 0;

    children.forEach((child) => {
      childrenWidth += child.getBoundingClientRect().width;
    });
    const gapsWidth = Math.max(0, children.length - 1) * gap;

    return childrenWidth * 1.5 + gapsWidth + padding + 24;
  }

  applySurroundSize() {
    this.element.style.overflow = "visible";
    this.element.setAttribute("preserveAspectRatio", "xMinYMin meet");

    if (this.type === "surround") {
      this.resizeSurroundPath(
        this.horizontalExpandedWidth || this.baseViewBoxWidth,
        this.verticalExtraHeight || 0,
      );
    } else if (this.type === "doubleSurround") {
      this.resizeDoubleSurroundPath(
        this.verticalExtraHeight || 0,
        this.otherVerticalExtraHeight || 0,
      );
    }
  }

  resizeSurroundPath(expandedWidth, extraHeight) {
    const extraWidth = expandedWidth - this.baseViewBoxWidth;
    const topRightStart = 302.65 + extraWidth;
    const bottomRightEdge = 313.12 + extraWidth;
    const topBridgeLength = 144.94 + extraWidth;
    const viewBoxHeight = this.baseViewBoxHeight + extraHeight;
    const renderedHeight =
      this.baseRenderedHeight + extraHeight * this.renderScale;

    this.element.style.height = renderedHeight + "px";
    this.element.setAttribute("viewBox", `-2 -2 327.42 ${viewBoxHeight}`);
    this.pathObject.setAttribute(
      "d",
      `M${topRightStart},0H80.64l.06,7.11-23.26,13.68-23.48-13.3-.06-7.48h-15.55C8.21,0,0,8.21,0,18.35v${135.06 + extraHeight}c0,11.05,8.95,20,20,20h14.01l.06,6.84,23.48,13.3,23.26-13.68-.05-6.47H${bottomRightEdge}v-30.52H157.66v7.64l-23.37,13.49-23.37-13.49v-7.64h-47.98l-5.72-3.24v-${67.65 + extraHeight}h53.75l.05,6.48,23.48,13.3,23.26-13.68-.05-6.1h${topBridgeLength}c10.13,0,18.35-8.21,18.35-18.35V18.35c0-10.13-8.21-18.35-18.35-18.35Z`,
    );
    this.foreignObject.setAttribute("width", expandedWidth);
  }

  resizeDoubleSurroundPath(extraHeight, otherExtraHeight = 0) {
    const totalExtraHeight = extraHeight + otherExtraHeight;
    const viewBoxHeight = this.baseViewBoxHeight + totalExtraHeight;
    const renderedHeight =
      this.baseRenderedHeight + totalExtraHeight * this.renderScale;

    this.element.style.height = renderedHeight + "px";
    this.element.setAttribute("viewBox", `-2 -2 323.21 ${viewBoxHeight}`);
    this.pathObject.setAttribute(
      "d",
      `M321.21,53.61l-.09-35.3C321.1,8.17,312.86-.02,302.73,0L80.72.54l.07,7.11-23.23,13.74-23.51-13.25-.08-7.48-15.55.04C8.29.71.1,8.95.12,19.08l.07,27.3h-.19v${234.52 + totalExtraHeight}c0,11.05,8.95,20,20,20h13.96v6.49l23.37,13.49,23.37-13.49v-6.15h221.58c5.52,0,10-4.48,10-10v-10.52c0-5.52-4.48-10-10-10h-145.46v7.64l-23.37,13.49-23.37-13.49v-7.64h-46.15l-6.6-3.81-.11.06v-${66.03 + otherExtraHeight}h53.51v5.32l23.39,13.49,23.39-13.49v-5.32h145.42c5.52,0,10-4.48,10-10v-17.21h.18v-20.52c0-5.52-4.48-10-10-10h-145.46v7.64l-23.37,13.49-23.37-13.49v-7.64h-47.46l-6.24-3.6v-${67.02 + extraHeight}l54.01-.13.07,6.48,23.51,13.25,23.23-13.74-.06-6.1,144.94-.35c10.13-.02,18.33-8.26,18.3-18.39Z`,
    );
    if (this.title2) {
      const title2Offset = 94 + extraHeight;
      this.title2.style.transform = `translate(0px, ${title2Offset}px)`;
    }
    this.otherChild?.otherReposition();
  }

  getChainExtraRenderedHeight(startBlock) {
    if (!startBlock) return 0;

    const chain = this.getChainBlocks(startBlock);
    const firstHeight = chain[0].element.getBoundingClientRect().height;
    const basicSlotHeight = 95.31 * this.renderScale;
    const firstBlockOverflow =
      chain[0].type === "basic"
        ? 0
        : Math.max(0, firstHeight - basicSlotHeight);

    const childOverflow = chain.slice(1).reduce((height, block) => {
      return (
        height +
        Math.max(
          0,
          block.element.getBoundingClientRect().height - blockSnapOverlap * 2,
        )
      );
    }, 0);

    return childOverflow + firstBlockOverflow;
  }

  getChainBlocks(startBlock = this) {
    const chain = [];
    let block = startBlock;

    while (block) {
      chain.push(block);
      block = block.child;
    }

    return chain;
  }

  updateSurroundHeight() {
    if (this.type !== "surround" && this.type !== "doubleSurround") return;

    let extraRenderedHeight = 0;
    let otherExtraRenderedHeight = 0;

    if (this.specialChild) {
      extraRenderedHeight = this.getChainExtraRenderedHeight(this.specialChild);
    }

    if (this.type === "doubleSurround" && this.otherChild) {
      otherExtraRenderedHeight = this.getChainExtraRenderedHeight(
        this.otherChild,
      );
    }

    this.verticalExtraHeight = extraRenderedHeight / this.renderScale;
    this.otherVerticalExtraHeight = otherExtraRenderedHeight / this.renderScale;
    this.applySurroundSize();
    this.specialChild?.specialReposition();
    this.otherChild?.otherReposition();
    this.child?.repostion(this);
    this.parent?.updateConnectedSurrounds();
  }

  checkOutOfBounds() {
    if (
      this.x < -10 ||
      this.y < -10 ||
      this.y > canvas.getBoundingClientRect().height * 0.92 ||
      this.x > canvas.getBoundingClientRect().width * 0.79
    ) {
      this.delete();
    }
  }

  getDoubleSurroundExtraY() {
    const baseElseAttachY = this.y + this.baseRenderedHeight - 140;
    const extraRenderedHeight =
      (this.verticalExtraHeight || 0) * this.renderScale;

    return baseElseAttachY + extraRenderedHeight + 72;
  }

  specialAttach(distance, block) {
    if (
      (block.type !== "surround" && block.type !== "doubleSurround") ||
      block.specialChild !== null
    ) {
      return false;
    }
    if (block.type === "surround") {
      if (
        Math.abs(this.x - (block.x + 43)) < distance &&
        Math.abs(
          this.y -
            (block.y +
              (block.baseRenderedHeight ||
                block.element.getBoundingClientRect().height) -
              69),
        ) < distance
      ) {
        return true;
      }
    } else {
      //double surround
      if (
        Math.abs(this.x - (block.x + 43.5)) < distance &&
        Math.abs(
          this.y -
            (block.y +
              (block.baseRenderedHeight ||
                block.element.getBoundingClientRect().height) -
              140),
        ) < distance
      ) {
        return true;
      }
    }
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

  otherAttach(distance, block) {
    if (block.type !== "doubleSurround") return false;
    // console.log(Math.abs(this.y - block.getDoubleSurroundExtraY()));
    if (
      Math.abs(this.x - (block.x + 43.5)) < distance &&
      Math.abs(this.y - block.getDoubleSurroundExtraY()) < distance
    ) {
      return true;
    } else {
      return false;
    }
  }

  intAttach(distance, input) {
    if (this.type !== "int") return false;
    const inputRect = input.getBoundingClientRect();
    const thisRect = this.element.getBoundingClientRect();
    if (
      Math.abs(thisRect.x - inputRect.left) < distance &&
      Math.abs(thisRect.y - inputRect.top) < distance
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
    pastedBlock.removeChild();
    pastedBlock.removeSpecialChild();
    return pastedBlock;
  }

  applyCopiedValues(copyData) {
    if (this.inputs) {
      this.inputs.forEach((input, index) => {
        input.value =
          copyData.inputValues?.[index] ?? copyData.inputValue ?? "";
      });
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

        this.removeChild();
        this.removeSpecialChild();
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
        this.specialChild?.deleteRipple();
        this.otherChild?.deleteRipple();
        this.inputVariables.forEach((intBlock) => {
          intBlock?.deleteRipple();
        });
        const index = blocks.indexOf(this);

        this.removeChild();
        this.removeSpecialChild();
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
        //block.pathObject.setAttribute("stroke", "#000000");
        //block.pathObject.setAttribute("stroke-width", "2");
      }
    });
  }

  removeParent() {
    if (!this.parent) return;

    const oldParent = this.parent;

    if (this.parentInput) {
      oldParent.removeIntVar(this.parentInput, this);
      return;
    }

    if (this.parent.child === this) {
      this.parent.child = null;
    }

    if (this.parent.specialChild === this) {
      this.parent.specialChild = null;
    }

    if (this.parent.otherChild === this) {
      this.parent.otherChild = null;
    }

    this.parent = null;
    oldParent.updateConnectedSurrounds();
  }

  getParent() {
    return this.parent;
  }

  setChild(child) {
    if (this.child && this.child !== child) {
      this.child.parent = null;
    }

    child.removeParent();
    this.child = child;
    child.parent = this;
    this.updateConnectedSurrounds();
  }

  removeChild() {
    if (this.child) {
      this.child.parent = null;
    }

    this.child = null;
    this.updateConnectedSurrounds();
  }

  setSpecialChild(child) {
    if (this.specialChild && this.specialChild !== child) {
      this.specialChild.parent = null;
    }

    child.removeParent();
    this.specialChild = child;
    child.parent = this;
    this.updateSurroundHeight();
  }

  removeSpecialChild() {
    if (this.specialChild) {
      this.specialChild.parent = null;
    }

    this.specialChild = null;
    this.updateSurroundHeight();
  }

  setOtherChild(child) {
    if (this.otherChild && this.otherChild !== child) {
      this.otherChild.parent = null;
    }

    child.removeParent();
    this.otherChild = child;
    child.parent = this;
    this.updateConnectedSurrounds();
  }

  removeOtherChild() {
    if (this.otherChild) {
      this.otherChild.parent = null;
    }

    this.otherChild = null;
    this.updateSurroundHeight();
  }

  setIntVar(input, intBlock) {
    const inputIndex = this.inputs.indexOf(input);
    if (inputIndex === -1) return;

    if (
      this.inputVariables[inputIndex] &&
      this.inputVariables[inputIndex] !== intBlock
    ) {
      this.inputVariables[inputIndex].parent = null;
      this.inputVariables[inputIndex].parentInput = null;
    }

    intBlock.removeParent();
    intBlock.parentInput = input;
    intBlock.parent = this;
    this.inputVariables[inputIndex] = intBlock;

    this.updateAttachedIntLayout();
  }

  removeIntVar(input, intBlock) {
    if (intBlock.parent !== this) return;

    const inputIndex = this.inputs.indexOf(input);
    if (inputIndex !== -1 && this.inputVariables[inputIndex] === intBlock) {
      this.inputVariables[inputIndex] = null;
    }

    input.style.width = "";
    intBlock.parent = null;
    intBlock.parentInput = null;
    this.updateAttachedIntLayout();
  }

  static getInputIndex(intBlock) {
    if (!intBlock.parentInput) return;
    return intBlock.parent.inputVariables.indexOf(intBlock);
  }

  static inputTaken(input) {
    if (blocks.find((block) => block.parentInput === input)) return true;
    return false;
  }

  updateConnectedSurrounds() {
    let block = this;

    while (block) {
      if (block.type === "surround" || block.type === "doubleSurround") {
        block.updateSurroundHeight();
      }

      block = block.parent;
    }
  }

  repostion(parent) {
    this.bringToFront();
    if (parent && parent.type === "basic") {
      this.x = parent.x;
      this.y = parent.y + parent.element.getBoundingClientRect().height - 13;
      this.element.style.left = this.x + "px";
      this.element.style.top = this.y + "px";
    } else if (parent && parent.type === "surround") {
      this.x = parent.x;
      this.y = parent.y + parent.element.getBoundingClientRect().height - 13;
      this.element.style.left = this.x + "px";
      this.element.style.top = this.y + "px";
    } else if (parent && parent.type === "doubleSurround") {
      this.x = parent.x;
      this.y = parent.y + parent.element.getBoundingClientRect().height - 13;
      this.element.style.left = this.x + "px";
      this.element.style.top = this.y + "px";
    } else if (parent && parent.type === "startBlock") {
      this.x = parent.x * 1;
      this.y = parent.y + parent.element.getBoundingClientRect().height - 14;
      this.element.style.left = this.x + "px";
      this.element.style.top = this.y + "px";
    }

    this.child?.repostion(this);
    this.specialChild?.specialReposition();
    this.otherChild?.otherReposition();
    this.inputVariables.forEach((intBlock) => {
      intBlock?.intReposition();
    });
  }

  specialReposition() {
    this.bringToFront();
    if (!this.parent || this.parent.specialChild !== this) return;
    if (this.parent.type === "surround") {
      this.x = this.parent.x + 43;
      this.y =
        this.parent.y +
        (this.parent.baseRenderedHeight ||
          this.parent.element.getBoundingClientRect().height) -
        69;
      this.element.style.left = this.x + "px";
      this.element.style.top = this.y + "px";
    } else {
      this.x = this.parent.x + 43.5;
      this.y =
        this.parent.y +
        (this.parent.baseRenderedHeight ||
          this.parent.element.getBoundingClientRect().height) -
        140;
      this.element.style.left = this.x + "px";
      this.element.style.top = this.y + "px";
    }
    this.child?.repostion(this);
    this.specialChild?.specialReposition();
    this.otherChild?.otherReposition();
    this.inputVariables.forEach((intBlock) => {
      intBlock?.intReposition();
    });
  }

  otherReposition() {
    this.bringToFront();
    if (!this.parent || this.parent.otherChild !== this) return;
    this.x = this.parent.x + 43.5;
    this.y = this.parent.getDoubleSurroundExtraY();
    this.element.style.left = this.x + "px";
    this.element.style.top = this.y + "px";
    this.child?.repostion(this);
    this.specialChild?.specialReposition();
    this.otherChild?.otherReposition();
    this.inputVariables.forEach((intBlock) => {
      intBlock?.intReposition();
    });
  }
  intReposition() {
    this.bringToFront();
    if (!this.parent || !this.parentInput) return;

    const thisRect = this.element.getBoundingClientRect();
    const inputRect = this.parentInput.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    this.x = inputRect.left - canvasRect.left - 3.5;
    this.y =
      inputRect.top -
      canvasRect.top +
      (inputRect.height - thisRect.height) / 2 -
      3.4; //keep this offset
    this.element.style.left = this.x + "px";
    this.element.style.top = this.y + "px";

    this.inputVariables.forEach((intBlock) => {
      intBlock?.intReposition();
    });
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
    block.classList.add("blockSvg--" + this.type);

    const title1 = block.querySelector("#title1");
    const title2 = block.querySelector("#title2");
    this.title2 = title2;

    const pathObject = block.querySelector("#pathObject");
    this.pathObject = pathObject;
    this.foreignObject = block.querySelector("foreignObject");
    this.scopeForeignObjectStyles();

    if (this.type === "surround") {
      this.baseViewBoxWidth = 327.42;
      this.baseViewBoxHeight = 197.4312;
    } else if (this.type === "doubleSurround") {
      this.baseViewBoxWidth = 323.21;
      this.baseViewBoxHeight = 322.89;
    } else if (this.type === "int") {
      this.baseViewBoxWidth = 120;
      this.baseViewBoxHeight = 46;
    } else {
      this.baseViewBoxWidth = 325;
      this.baseViewBoxHeight = 95.31;
    }

    const inputs = Array.from(block.querySelectorAll(".blockInput"));
    const input = inputs[0] || null;
    const selectionBox = block.querySelector(".blockSelectionBox");
    const intAcceptor = block.querySelector(".intacceptor");
    this.inputs = inputs;
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

    inputs.forEach((input) => {
      input.addEventListener("mousedown", (event) => {
        event.stopPropagation();
      });

      input.addEventListener("input", () => {
        console.log("input");
        this.resizeToFitContent();
        this.updateInputParentLayout();
      });
    });

    //----------------------------------Text-----------------------------

    let textSplit = this.text.split("$");
    if (title1 !== null) {
      title1.textContent = textSplit[0] || "";
    }
    if (title2 !== null) {
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

    if (!this.hasInput) {
      inputs.forEach((input) => {
        input.style.display = "none";
      });
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

    block.addEventListener("mouseover", () => {
      if (!this.isDragging) {
        block.style.cursor = "grab";
      } else {
        block.style.cursor = "grabbing";
      }
    });

    block.addEventListener("mouseleave", () => {
      if (!this.isDragging) {
        block.style.cursor = "default";
      }
    });

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
        //this.pathObject.setAttribute("stroke", "#ffed77");
        //this.pathObject.setAttribute("stroke-width", "4");
      }

      // WORKSPACE BLOCKS

      this.bringToFront();
      this.child?.bringToFront();
      this.specialChild?.bringToFront();
      this.otherChild?.bringToFront();
      this.inputVariables.forEach((intBlock) => {
        intBlock?.bringToFront();
      });

      this.isDragging = true;
      this.element.style.cursor = "grabbing";
      const rect = block.getBoundingClientRect();

      this.offsetX = event.clientX - rect.left;
      this.offsetY = event.clientY - rect.top;
    });

    if (!this.isTemplate) {
      document.addEventListener("mousemove", (event) => {
        if (!this.isDragging) return;

        const canvasRect = canvas.getBoundingClientRect();

        this.x = event.clientX - canvasRect.left - this.offsetX;
        this.y = event.clientY - canvasRect.top - this.offsetY;

        block.style.left = this.x + "px";
        block.style.top = this.y + "px";
        this.child?.repostion(this);
        this.specialChild?.specialReposition();
        this.otherChild?.otherReposition();
        this.inputVariables.forEach((intBlock) => {
          intBlock?.intReposition();
        });
      });
    }

    document.addEventListener("mouseup", () => {
      this.checkOutOfBounds();

      this.applyToAllChildren((child) => child.bringToFront());
      this.element.style.cursor = "grab";
      this.isDragging = false;

      if (
        !this.getParent() &&
        this.type !== "startBlock" &&
        this.type !== "int"
      ) {
        //So child blocks don't snap to other blocks when they are already snapped to a block
        blocks.forEach((block) => {
          if (
            this.otherAttach(20, block) &&
            block !== this &&
            block.otherChild === null
          ) {
            block.setOtherChild(this);
            this.x = block.x + 43.5;
            this.y = block.getDoubleSurroundExtraY();
            this.element.style.left = this.x + "px";
            this.element.style.top = this.y + "px";
          }
          if (
            this.attachProximity(15, block) &&
            block !== this &&
            block.child === null
          ) {
            console.log("snapped");
            if (block.type === "basic") {
              this.x = block.x;
              this.y =
                block.y + block.element.getBoundingClientRect().height - 13;
              this.element.style.left = this.x + "px";
              this.element.style.top = this.y + "px";
              this.bringToFront();
              block.setChild(this);
            } else if (block.type === "surround") {
              this.x = block.x;
              this.y =
                block.y + block.element.getBoundingClientRect().height - 13;
              this.element.style.left = this.x + "px";
              this.element.style.top = this.y + "px";
              this.bringToFront();
              block.setChild(this);
            } else if (block.type === "doubleSurround") {
              this.x = block.x;
              this.y =
                block.y + block.element.getBoundingClientRect().height - 13;
              this.element.style.left = this.x + "px";
              this.element.style.top = this.y + "px";
              this.bringToFront();
              block.setChild(this);
            } else if (block.type === "startBlock") {
              this.x = block.x * 1;
              this.y =
                block.y + block.element.getBoundingClientRect().height - 14;
              this.element.style.left = this.x + "px";
              this.element.style.top = this.y + "px";
              this.bringToFront();
              block.setChild(this);
            }
          } else {
            if (this.getParent() === block) {
              block.removeChild();
            }
          }
          if (
            this.specialAttach(20, block) &&
            block !== this &&
            block.specialChild === null
          ) {
            if (block.type === "surround") {
              this.x = block.x + 44;
              this.y =
                block.y +
                (block.baseRenderedHeight ||
                  block.element.getBoundingClientRect().height) -
                69;
              this.element.style.left = this.x + "px";
              this.element.style.top = this.y + "px";
              block.setSpecialChild(this);
            } else if (block.type === "doubleSurround") {
              this.x = block.x + 43.5;
              this.y =
                block.y +
                (block.baseRenderedHeight ||
                  block.element.getBoundingClientRect().height) -
                140;
              this.element.style.left = this.x + "px";
              this.element.style.top = this.y + "px";
              block.setSpecialChild(this);
            }
          }
        });
      }
      if (this.type === "int") {
        blocks.forEach((block) => {
          block.inputs.forEach((input) => {
            if (this.intAttach(15, input) && block !== this) {
              block.setIntVar(input, this);
            } else {
              if (this.parent === block && this.parentInput === input) {
                block.removeIntVar(input, this);
              }
            }
          });
        });
      }
      this.child?.repostion(this);
      this.specialChild?.specialReposition();
      this.otherChild?.otherReposition();
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
      if (this.type !== "int") {
        this.element.removeAttribute("preserveAspectRatio");
      }
      requestAnimationFrame(() => {
        this.resizeToFitContent();
      });
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
  "If$Else",
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
  "Move$seconds",
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
  "Turn$degrees",
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

new Block("=", "oper", false, true, 0, 0, true, new Map(), "int", 0);

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
  "Repeat$Times",
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

new Block("/", "oper", false, true, 0, 0, true, new Map(), "int", 0);

const panelContainer = document.getElementById("panelContainer");
const pannelButton = document.getElementById("panelButton");
const panelArrow = document.getElementById("panelArrow");
let panelActive = false;

pannelButton.addEventListener("click", () => {
  console.log("clicked");
  if (panelActive) {
    panelContainer.classList.remove("active");
    panelArrow.classList.remove("active");
    panelActive = false;
  } else {
    panelArrow.classList.add("active");
    panelContainer.classList.add("active");

    panelActive = true;
  }
});
