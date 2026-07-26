const toolbox = {
  kind: "categoryToolbox",
    contents: [
        {
    kind: "category",
    name: "Movement",
    colour: "#ffe100",
    contents: []
},
{
    kind: "category",
    name: "Logic",
    colour: "#5e0eff",
    contents: [ {
                    kind: "block",
                    type: "logic_compare"
                },
                {
                    kind: "block",
                    type: "logic_boolean"
                }
            ]
},
{
    kind: "category",
    name: "Operators",
    colour: "#ff0e0e",
    contents: [ {
                    kind: "block",
                    type: "math_number"
                },
                {
                    kind: "block",
                    type: "math_arithmetic"
                }]
},
{
    kind: "category",
    name: "Loops",
    colour: "#12ff0e",
    contents: [ {
                    kind: "block",
                    type: "controls_repeat_ext"
                },
                {
                    kind: "block",
                    type: "controls_whileUntil"
                }]
},
{
    kind: "category",
    name: "Sensors",
    colour: "#ff0eef",
    contents: []
}
      
    ]
};

    const urbanRescueTheme = Blockly.Theme.defineTheme("urbanRescue", {
    name: "urbanRescue",

    base: Blockly.Themes.Classic,

    componentStyles: {
        workspaceBackgroundColour: "#161f3b",

        toolboxBackgroundColour: "#282f44",
        toolboxForegroundColour: "#f5d061",

        flyoutBackgroundColour: "#333c4a",
        flyoutForegroundColour: "#ffffff",

        flyoutOpacity: 1,

        scrollbarColour: "#e6af2e",
        scrollbarOpacity: 0.5,

        insertionMarkerColour: "#e6af2e",

        insertionMarkerOpacity: 0.4,

        selectedGlowColour: "#f5d061",
        selectedGlowOpacity: 0.35,

        replacementGlowColour: "#4a78c2",
        replacementGlowOpacity: 0.3
    },

    fontStyle: {
        family: "Elms Sans",
        weight: "normal",
        size: 14
    }
});

const workspace = Blockly.inject(document.getElementById("blocklyDiv"), {
    toolbox: toolbox, 
    theme: urbanRescueTheme,
     renderer: "zelos"
});

const panelContainer = document.getElementById("panelContainer");
const pannelButton = document.getElementById("panelButton");
const panelArrow = document.getElementById("panelArrow");
export let panelActive = false;

pannelButton.addEventListener("click", () => {
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





