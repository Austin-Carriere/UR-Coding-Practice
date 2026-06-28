import { Point, Segment, Polygon } from "https://cdn.jsdelivr.net/npm/@flatten-js/core/+esm";

const canvas = document.querySelector(".canvasPopup");
const panel = document.querySelector(".panel")
const ctx = canvas.getContext("2d");
const panelOverlay = document.querySelector(".canvasOverlay");
let overlayNum = 1;

const levelSelectorButton = document.getElementById("levelSelectorButton");

let panelActive = false

let canvasObjects = []; //Store one copy of everything on the canvas

class CanvasObject {
  //abstract
  constructor(x, y, z, image, scale = 1, heading = 0) {
    if (new.target === CanvasObject) {
      //Make sure you cannot create an instance of this class
      throw new Error("Cannot instantiate an abstract class directly.");
    }
    canvasObjects.push(this);

    this.x = x;
    this.y = y;
    this.z = z;
    this.scale = scale;
    this.image = image;
    this.width = image.width * scale;
    this.height = image.height * scale;
    this.heading = heading;
    
  }

  update() {
    this.draw();
  }

  static sortCanvasObjects() {
    canvasObjects.sort((a, b) => a.z - b.z); //Sorting from smallest z to largest z
  }

  draw() {
    ctx.save();
    ctx.translate(this.actualX + this.width / 2, this.actualY + this.height / 2 ); //this.width / 2 is center of the picture
    ctx.rotate(toRadians(this.heading));
    ctx.drawImage(this.image,  (-this.width / 2), (-this.height / 2), this.width, this.height);
    ctx.restore();
  }

  delete() {
    const index = canvasObjects.indexOf(this);

    if (index > -1) {
      canvasObjects.splice(index, 1); // Removes exactly 1 item at the found index
    }
  }

  get actualX() {
    return camera.x - this.x;
  }

  get actualY() {
    return camera.y - this.y;
  }

  bringToFront() {
    CanvasObject.sortCanvasObjects(); //Make sure list is sorted before hand
    let highestZIndex = canvasObjects[canvasObjects.length - 1].z;
    this.z = highestZIndex + 1;
    CanvasObject.sortCanvasObjects();
  }
  bringToBack() {
    CanvasObject.sortCanvasObjects(); //Make sure list is sorted before hand
    let lowestZIndex = canvasObjects[0].z;
    this.z = lowestZIndex-1;
    CanvasObject.sortCanvasObjects();
  }

  setZ(newZ) {
    this.z = newZ;
  }

  setAvgLayer(percent) {
    var totalZ = 0;
    canvasObjects.forEach((obj) => {
      totalZ += obj.z;
    });
    this.z = ((percent / 50) * totalZ) / canvasObjects.length;
  }
}

class ConcreteObject extends CanvasObject {
  constructor(x, y, z, image, scale, heading) {
    if (new.target === ConcreteObject) {
      throw new console.error("Cannot Instantiate Concrete Object");
    }
    super(x, y, z, image, scale, heading);
    this.hitbox = this.updatePolygonPos();
    this.moveable = false;
  }

  update() {
    super.update(); //Echo through to Canvas Object
    if (this.moveable) this.hitbox = this.updatePolygonPos();
  }

  updatePolygonPos() {
    return new Polygon([
      new Point(this.x, this.y),
      new Point(this.x + this.width, this.y),
      new Point(this.x + this.width, this.y + this.height),
      new Point(this.x, this.y + this.height),
    ]);
  }

  isIntersecting(objs) {
    for (const object of objs) {
    if (object === this) continue; //Just in case for some reason objs contains the caller

    if (this.hitbox.intersect(object.hitbox).length !== 0) {
      return true;
    }
    }   
    return false;
  }

  intersectingObjects(objs) {
    let intersectingObjects = [];
    objs.forEach((object) => {
        if (object === this) return; //Just in case for some reason objs contains the caller
      if (this.hitbox.intersect(object.hitbox).length !== 0) {
        intersectingObjects.push(object);
      }
    });
    return intersectingObjects
  }
}

class FloatingObject extends CanvasObject {
  constructor(x, y, z, image, scale, heading) {
    if (new.target === FloatingObject) {
      throw new console.error("Cannot Instantiate Floating Object");
    }
    super(x, y, z, image, scale, heading);
  }


}

class PlayerCar extends ConcreteObject {
  constructor(x, y, image, heading = 0){
    super(x, y, 20, image, 1, heading);
  }

  update(){
    super.update()
    this.moveForward(1);
    this.rotateBy(0.5);
  }

  rotateBy(degrees) {
    this.heading += degrees;
  }

  rotateTo(degress) {
    this.heading = degress;
  }

  moveTo(x, y){
    this.x = x;
    this.y = y;
  }

  moveForward(units){
    this.x -= (units * Math.sin(toRadians(this.heading))); //units is negative because otherwise it goes backwards
    this.y += (units * Math.cos(toRadians(this.heading)));
  }

  moveBackward(units){
    this.moveForward(-units);
  }

  changeImage(newImageSrc){
    this.image = images[newImageSrc];
  }

}

let drag = false;
let mouseX = 0;
let mouseY = 0;

class Camera {
  constructor(borderX, borderY, x= 0, y= 0){
    this.x = x;
    this.y = y;
    this.borderX = borderX;
    this.borderY = borderY;
    this.zoom = 1;
    this.onCreation();
  }

  outOfBoundsCorrection(){
    if (Math.abs(this.x) > this.borderX){
      this.x = Math.min(this.borderX, Math.max(-this.borderX, this.x));
    }

    if (Math.abs(this.y) > this.borderY){
      this.y = Math.min(this.borderY, Math.max(-this.borderY, this.y));
    }
  }

  setBorder(newBorderX, newBorderY){
    this.borderX = newBorderX;
    this.borderY = newBorderY;
  }
  

  onCreation(){

    document.addEventListener("mouseup", (event) => {
      drag = false;
    })

    canvas.addEventListener("mousemove", (event) => {
      if (!drag) return;
      this.x += (event.offsetX - mouseX) * (1/this.zoom); //apply the difference to the camera
      this.y += (event.offsetY - mouseY) * (1/this.zoom);
      this.outOfBoundsCorrection();
        mouseX = event.offsetX; //Reset the last position
        mouseY = event.offsetY;
    })

    canvas.addEventListener("mousedown", (event)=>{
        mouseX = event.offsetX; //set the first mouse (x, y)
        mouseY = event.offsetY;
        drag = true;
    })

    canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    this.zoom += -event.deltaY/1240
    this.zoom = Math.min(2.3, Math.max(0.7, this.zoom)); //Bound zoom
});

  }

  
}
const camera = new Camera(800, 800);


function loop(){
  if (panelActive) {
    updateOverlay();
   requestAnimationFrame(loop); //To Pause if Overlay is on
    return;
  } 
  updateOverlay();
 ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2, canvas.height / 2); // set center to (0,0)

    ctx.scale(camera.zoom, camera.zoom);
  canvasObjects.forEach((object) => {
    object.update();
  });
  
  
  requestAnimationFrame(loop);

}


function toRadians(degrees){
  return degrees * (Math.PI/180);
}

function resizeCanvas() {
  canvas.width = panel.getBoundingClientRect().width*.87;
  canvas.height = panel.getBoundingClientRect().height*.87;
   panelOverlay.style.height = canvas.height + "px";
  let overlayCoverPose = -parseFloat(getComputedStyle(canvas).marginRight) + -canvas.width + -parseFloat(getComputedStyle(canvas).borderRight);
  console.log(canvas.width);
  panelOverlay.style.transform = `translateX(${overlayCoverPose}px)`;
  updateOverlay();


  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.imageSmoothingEnabled = false; //to Stop anti-aliasing
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
}

const carChangeMenu = document.getElementById("CarChange");
const levelSelectorMenu = document.getElementById("levelSelector");
 
function updateOverlay(){
  disableAllOverlays();
  if (panelActive){
    panelOverlay.style.width = canvas.width + "px" ;
  } else {
    panelOverlay.style.width = 0;
  }
  if (overlayNum === 1){
    carChangeMenu.style.width = "";
  } else if(overlayNum === 2){
    levelSelectorMenu.style.width = "";
  }


}

function disableAllOverlays(){
  carChangeMenu.style.width = 0;
  levelSelectorMenu.style.width = 0;
}



resizeCanvas();
window.addEventListener("resize", resizeCanvas);



//-------------------Car Changer-------------------------

const RArrowColor = document.getElementById("RightArrowButtonColor");
const LArrowColor = document.getElementById("LeftArrowButtonColor");
const RArrowType = document.getElementById("RightArrowButtonType")
const LArrowType = document.getElementById("LeftArrowButtonType");
const CarPreview = document.getElementById("CarPreview");
const carCostumeText = document.querySelector(".CarCostumeText");
const carTypeText = document.querySelector("#CarTypeText");
const confirmButton = document.querySelector(".CarCostumeConfirmButton");
const carChangerButton = document.getElementById("carChangerButton");

let colorIndex = 0;
let typeIndex = 0;

const colorArray = [
  ["Black", "Blue", "Gray", "Red", "White", "Yellow"],
  ["Black", "Orange", "Pink", "Yellow"],
  ["Black", "Red", "White", "Yellow"],
  ["Black", "Blue", "Red", "White"]
];

const typeArray = ["Truck", "Racer", "Mustang", "Corvette"];

//--------------------------ImagePreload---------------------------------
const images = {};

for (let t = 0; t < typeArray.length; t++) {
    for (const color of colorArray[t]) {
        const path = `/images/Cars/${color}_Car${t + 1}.png`;

        const img = new Image();
        img.src = path;

        images[path] = img;
    }
}

// Then create the player
let car = new PlayerCar(
    400,
    400,
    images[`/images/Cars/${colorArray[0][0]}_Car1.png`], //have to do this weird arrangment so I can load all the images in first
    270
);

//--------------------Car Changer cont.----------------------------------
RArrowColor.addEventListener("click", () =>{
  if(colorIndex + 1 === colorArray[typeIndex].length){
    colorIndex = 0;
  } else {
    colorIndex++;
  }
  updateCarPreview();
});

LArrowColor.addEventListener("click", ()=>{
  if (colorIndex === 0){
    colorIndex = colorArray[typeIndex].length-1;
  } else{
    colorIndex--;
  }
  
  updateCarPreview();
});

RArrowType.addEventListener("click", ()=>{
  if (typeIndex +1 === typeArray.length){
    typeIndex = 0;
    colorIndex = 0;
  } else {
    typeIndex++;
    colorIndex = 0;
  }

  updateCarPreview()
});

LArrowType.addEventListener("click", ()=>{
    if (typeIndex === 0){
    typeIndex = typeArray.length-1;
    colorIndex = 0;
  } else{
    typeIndex--;
    colorIndex = 0;
  }
  
  updateCarPreview();
});

function updateCarPreview(){
  CarPreview.src = `/images/Cars/${colorArray[typeIndex][colorIndex]}_Car${typeIndex+1}.png`;

  carCostumeText.textContent = colorArray[typeIndex][colorIndex]
  carTypeText.textContent = typeArray[typeIndex];
}

confirmButton.addEventListener("click", ()=> {
  car.changeImage(`/images/Cars/${colorArray[typeIndex][colorIndex]}_Car${typeIndex+1}.png`);
  panelActive = false;
  updateOverlay();
});
updateCarPreview();

carChangerButton.addEventListener("click", ()=>{
  if (overlayNum === 1){
    panelActive = !panelActive;
  } else {
    panelActive = true;
    overlayNum = 1;
  }
  updateOverlay();
});

levelSelectorButton.addEventListener("click", ()=>{
  console.log("Before: ", panelActive);
  if (overlayNum === 2){
    panelActive = !panelActive;
  } else {
    panelActive = true;
    overlayNum = 2;
  }
  console.log("After: ", panelActive);
  updateOverlay();
});


loop();