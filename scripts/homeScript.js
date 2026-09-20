const lvlArea = document.querySelector(".levelSelectionHome");
const playButton = document.querySelector(".playButton");
const title = document.querySelector(".titlePlayButton");
let backgroundImages = [];
let currentRow = null;
let levels = [];


for (let i = 1; i <= 1; i++){
  let newImage = new Image();
  newImage.src = `/images/Enviorment Assets/Backgrounds/Preview/${i}.png`;
  backgroundImages[i-1] = newImage;
}

playButton.addEventListener("click", ()=>{
    title.classList.add("inactive");
    lvlArea.classList.remove("selectionInactive");
})

window.addEventListener("scroll", () => {
    console.log(window.scrollX, window.scrollY);
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
  constructor(title, description){
    levels.push(this);
    this.title = title;
    this.description = description;
    this.lvlNum = levels.indexOf(this) + 1;
    this.preview = backgroundImages[levels.indexOf(this)];
    this.stars = [0,0,0];
    this.element = this.createElement();
    Level.assignStars(JSON.parse(localStorage.getItem("stars")));
  }

  static assignStars(stars){
    let starArray = stars;
    for(let level of levels){
      level.editStars(new Array(starArray[0], starArray[1], starArray[2]))
      starArray = starArray.slice(3);
      level.updateStars();
    }
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


new Level("Driving Test", "Drive around town to get your license");

