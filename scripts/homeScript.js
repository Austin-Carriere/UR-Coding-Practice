const lvlArea = document.querySelector(".levelSelectionHome");
const playButton = document.querySelector(".playButton");
const title = document.querySelector(".titlePlayButton");
let backgroundImage = new Image();
backgroundImage.src = "/images/Enviorment Assets/Backgrounds/Background 1.png";
let currentRow = null;

playButton.addEventListener("click", ()=>{
    title.classList.add("inactive");
    lvlArea.classList.remove("selectionInactive");
})

window.addEventListener("load", () => {
    window.scrollTo(0, 0);
});



class row{
    constructor(){
        this.element = this.createElement();
        currentRow = this.element;
    }

    createElement(){
        let template = document.querySelector(".LevelContainerTemplate");
        const row = template.content.cloneNode(true).querySelector(".levelRow");
        lvlArea.append(row);
        return row;
    }
}

new row();

class Level{
  constructor(backgroundImage, title, description, preview){
    levels.push(this);
    this.backgroundImage = backgroundImage;
    this.title = title;
    this.description = description;
    this.lvlNum = levels.indexOf(this) + 1;
    this.objectList = [];
    this.preview = preview;
    this.stars = [0,0,0];
    this.element = this.createElement();
  }

 

  editStars(array){
    for (let i=0; i < this.stars.length; i++){
       this.stars[i] = array[i];
    }
    this.updateStars();
  }

  updateStars(){
    for(let i = 0; i < this.stars.length; i++){
      if (this.stars[i] === 1) {
        this.starsImage[i].src = "/images/Star Full.png";
      } else {
        this.starsImage[i].src = "/images/Star Empty.png";
      }
    }
  }

  

  createElement(){
    let template = document.querySelector(".LevelModuleTemplate");
    const module = template.content.cloneNode(true).querySelector(".LevelModule");
    const lvlNum = module.querySelector(".LevelModuleLvlNum");
    const title = module.querySelector(".LevelModuleTitle");
    const preview = module.querySelector(".LevelPreview img");
    const stars = module.querySelectorAll(".starContainer img");
    const description = module.querySelector(".description");
    title.textContent = this.title;
    lvlNum.textContent = this.lvlNum;
    description.textContent = this.description;
    preview.setAttribute("src", this.preview.src);
    this.starsImage = stars;


    if (maxLvl < this.lvlNum){
      module.classList.add("locked");
    }

    module.addEventListener("click", ()=>{
      if (module.classList.contains("locked")) return;
        window.location.href = `workspace.html?level=${this.lvlNum}`;
    });
    this.updateStars();
    currentRow.append(module);
    if (this.lvlNum % 4 === 0) new row(); //Make a new row
    return module;
  }  
}


new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
new Level(backgroundImage, "Test", "This is a test Level", backgroundImage);
