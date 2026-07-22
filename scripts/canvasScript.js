import { Point, Segment, Polygon} from "https://cdn.jsdelivr.net/npm/@flatten-js/core/+esm";
import {panelActive} from "/scripts/app.js";
import Victor from "https://cdn.jsdelivr.net/npm/victor@1.1.0/+esm";

const canvas = document.querySelector(".canvasPopup");
const panel = document.querySelector(".panel")
const ctx = canvas.getContext("2d");
const panelOverlay = document.querySelector(".canvasOverlay");
let overlayNum = 1;
let backgroundImage = new Image();
backgroundImage.src = "/images/Enviorment Assets/Backgrounds/Background 1.png";
let paused = false;
const BackgroundScaleFactor = 0.242;
let currentLvl = 1;
let maxLvl = 1;

let debugMode = true; //If true, will show hitboxes and other debug info

//-------------------Enviorment Asset Loader-------------------------
let billboardImages = [];
let trashcanImages = [];
let trafficLightImages = [];
let thinBuildings = [];
let images = {};
async function preloadImages() {
  let promises = [];
  for (let i = 1; i <= 7; i++) {
    promises.push(
      loadImage(`/images/Enviorment Assets/Billboards/Billboard${i}.png`)
    );
  }
  
  billboardImages = await Promise.all(promises);

  promises = [];

  for (let i = 1; i <= 3; i++){
    promises.push(
      loadImage(`/images/Enviorment Assets/Trash Cans/trashcan${i}.png`)
    );
  }

  trashcanImages = await Promise.all(promises);
  

 

  for (let t = 0; t < typeArray.length; t++) {
    for (const color of colorArray[t]) {
        const path = `/images/Cars/${color}_Car${t + 1}.png`;
        images[path] = await loadImage(path);
    }
}
    promises = [];
    for (let i = 1; i<=14; i++){
      promises.push(
        loadImage(`/images/Enviorment Assets/Traffic Lights/TrafficLight${i}.png`)
      );
    }

    trafficLightImages = await Promise.all(promises);

    promises = [];

    for (let i = 1; i <= 7; i++){
      promises.push(
        loadImage(`/images/Enviorment Assets/Buildings/Thin Buildings/Building${i}.png`)
      );
    }
    thinBuildings = await Promise.all(promises);
};


const levelSelectorButton = document.getElementById("levelSelectorButton");
const playButton = document.getElementById("playButton");
const restartButton = document.getElementById("restartButton");
const playButtonImg = document.querySelector("#playButton img");

let overlayActive = false


let canvasObjects = []; //Store one copy of everything on the canvas
let levels = [];
class Level{
  constructor(backgroundImage, title, description, preview, carStartPoint, heading = 0){
    levels.push(this);
    this.backgroundImage = backgroundImage;
    this.title = title;
    this.description = description;
    this.lvlNum = levels.indexOf(this) + 1;
    this.objectList = [];
    this.preview = preview;
    this.stars = [0,0,0];
    this.element = this.createElement();
    this.carStartPoint = carStartPoint;
    this.carStartHeading = heading;
  }

  activate(){
    currentLvl = this.lvlNum;
    canvasObjects = [];
    rigidBodies = [];
    canvasObjects = this.objectList;
    for (let object of this.objectList){
      if (object instanceof RigidBody) rigidBodies.push(object);
    }
    car.onLevelStart(this.carStartPoint, this.carStartHeading);
  }

  editStars(array){
    for (let i=0; i < this.stars.length; i++){
       this.stars[i] = array[i];
    }
    this.updateStars();
  }

  addObjects(array){
    this.objectList.push(...array);
    return this;
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
    const levelContainer = document.querySelector(".levelsContainer");
    title.textContent = this.title;
    lvlNum.textContent = this.lvlNum;
    preview.setAttribute("src", this.preview.src);
    this.starsImage = stars;
    levelContainer.append(module);

    if (maxLvl < this.lvlNum){
      module.classList.add("locked");
    }

    module.addEventListener("click", ()=>{
      if (module.classList.contains("locked")) return;
      this.activate();
      overlayActive = false;
      updateOverlay();
    });
    this.updateStars();
    return module;
  }
}



class CanvasObject {
  //abstract
  constructor(x, y, z, image, scale = 1, heading = 0) {
    if (new.target === CanvasObject) {
      //Make sure you cannot create an instance of this class
      throw new Error("Cannot instantiate an abstract class directly.");
    }

    this.x = x;
    this.y = y;
    this.z = z;
    this.scale = scale;
    this.image = image;
    this.width = image.width * scale;
    this.height = image.height * scale;
    this.heading = heading;
    CanvasObject.sortCanvasObjects();
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
  constructor(x, y, z, image, scale = 1, heading = 0, hitboxXOffset = 0, hitboxYOffset = 0, hitboxWidth = image.width, hitboxHeight = image.height) {
    if (new.target === ConcreteObject) {
      throw new console.error("Cannot Instantiate Concrete Object");
    }
    super(x, y, z, image, scale, heading);
   
    this.moveable = false;
    this.hitboxWidth = hitboxWidth * scale;
    this.hitboxHeight = hitboxHeight * scale; 
    this.hitboxOffset = new Victor(hitboxXOffset, hitboxYOffset);
    this.fillColor = "red";
    this.hitbox = this.updatePolygonPos();
  }

  //need to make offset be consitent with rotation

get hitboxX() {
  return this.actualX + this.hitboxOffset.x;
}

get hitboxY() {
  return this.actualY + this.hitboxOffset.y;
}

  get center() {
    let x = 0;
    let y = 0;

    for (let point of this.hitboxPoints) {
        x += point.x;
        y += point.y;
    }

    return new Victor(
        x / this.hitboxPoints.length,
        y / this.hitboxPoints.length
    );
}

  update() {
    super.update(); //Echo through to Canvas Object
    this.hitbox = this.updatePolygonPos();
    this.drawHitbox();
  }

  updatePolygonPos() {
    const angle = toRadians(this.heading);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const x = this.hitboxX;
    const y = this.hitboxY;

    const cx = x + this.hitboxWidth / 2;
    const cy = y + this.hitboxHeight / 2;

    function rotatePoint(px, py) {
        const dx = px - cx;
        const dy = py - cy;

        return new Point(
            cx + dx * cos - dy * sin,
            cy + dx * sin + dy * cos
        );
    }

    const p1 = rotatePoint(x, y);
    const p2 = rotatePoint(x + this.hitboxWidth, y);
    const p3 = rotatePoint(x + this.hitboxWidth, y + this.hitboxHeight);
    const p4 = rotatePoint(x, y + this.hitboxHeight);

    this.hitboxPoints = [p1, p2, p3, p4];

    return new Polygon(this.hitboxPoints);
}

 drawHitbox() {
  if (!debugMode) return; //Only draw hitboxes if debugMode is true
    ctx.strokeStyle = this.fillColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(this.hitboxPoints[0].x, this.hitboxPoints[0].y);

    for (let i = 1; i < this.hitboxPoints.length; i++) {
        ctx.lineTo(this.hitboxPoints[i].x, this.hitboxPoints[i].y);
    }

    ctx.closePath();
    ctx.stroke();
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
      if (object.collide(this)) {
        intersectingObjects.push(object);
      }
    });
    return intersectingObjects
  }
}
let rigidBodies = [];
class RigidBody extends ConcreteObject {
  constructor(x, y, z, image, mass, scale = 1, heading = 0, hitboxXOffset = 0, hitboxYOffset = 0, hitboxWidth = image.width, hitboxHeight = image.height, ) {
    if (new.target === RigidBody) {
      throw new console.error("Cannot Instantiate Rigid Body");
    }
    super(x, y, z, image, scale, heading, hitboxXOffset, hitboxYOffset, hitboxWidth, hitboxHeight);
     this.startX = x;
    this.startY = y;
    this.startHeading = heading;
    this.velocity = new Victor(0, 0);
    this.collisionImmunity =0;
    this.constrained = true;
    this.mass = mass;
    this.fillColor = "blue";
    }

    reset(){
    this.moveTo(this.startX, this.startY);
    this.rotateTo(this.startHeading);
    this.velocity = new Victor(0, 0);
  }

  drawVector(){
    if (!debugMode) return;
    ctx.beginPath();
    ctx.moveTo(this.actualX + this.width/2, this.actualY + this.height/2);
    ctx.lineTo((this.actualX + this.width/2 + this.velocity.x * -10), (this.actualY + this.height/2 + this.velocity.y* -10));
    
  
      ctx.lineWidth = 15;          
      ctx.strokeStyle = '#ff0000'; 
      ctx.lineCap = 'butt';

      ctx.stroke();
  }

  drawGivenVector(vector){
    if (!debugMode) return;
    ctx.beginPath();
    ctx.moveTo(this.actualX + 20, this.actualY);
    ctx.lineTo((this.actualX + 20 + vector.x * -10), (this.actualY + vector.y* -10));
    
  
      ctx.lineWidth = 10;          
      ctx.strokeStyle = '#2fff00'; 
      ctx.lineCap = 'butt';

      ctx.stroke();
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

  moveBy(x, y){
    this.x += x;
    this.y += y;
  }
    

  update(){
      super.update();
      this.drawVector();
      if (paused) return;
      this.moveByVector(this.velocity); //Move by velocity every Tick
      this.velocity.multiplyScalar(0.97); //Friction
      this.drawVector();
      if (this.collisionImmunity > 0){
        this.collisionImmunity--;
      }
  }

  setVelocity(x, y){
    this.velocity = new Victor(x, y);
  }

  get speed(){
    return this.velocity.length();
  }

  setSpeed(speed){
    let forward = new Victor(
        -Math.sin(toRadians(this.heading)),
         Math.cos(toRadians(this.heading))
    );
    this.velocity = forward;
  }

  moveByVector(vector){
    try {
    this.x += vector.x;
    this.y += vector.y;
    } catch (error) {
      this.velocity = new Victor(0, 0);
      console.log("Error in moveByVector: ", error);
    }
    
  }

  onCollision(collider){
    if (this.constrained) return;
    let randomNum = Math.random();
    if (this.collisionImmunity > 0) return;

    this.collisionImmunity += 30;
    this.velocity.add(collider.velocity.clone()).multiplyScalar(collider.mass/this.mass).multiplyScalar(0.8);
    collider.velocity.multiplyScalar(this.mass/collider.mass);
    this.velocity.rotate(toRadians(randomNum * 80 - 40));
  }

accelerate(amount) {
    let forward = new Victor(
        -Math.sin(toRadians(this.heading)),
         Math.cos(toRadians(this.heading))
    );

    this.velocity.add(
        forward.multiplyScalar(amount)
    );
}

static angleDifference(a, b) {
    return ((a - b + 180) % 360) - 180;
}
 computeAxis(p1, p2) {
    let edge = new Victor(
        p2.x - p1.x,
        p2.y - p1.y
    );

    return {
        normal: new Victor(-edge.y, edge.x).normalize(),
        edge: {
            p1,
            p2
        },
        owner: this
    };
}

  get axes(){
     return [
        this.computeAxis(this.hitboxPoints[0], this.hitboxPoints[1]),
        this.computeAxis(this.hitboxPoints[1], this.hitboxPoints[2])
    ];
  }

  project(axis){
    let max = -Infinity;
    let min = Infinity;

    for (let i = 0; i < this.hitboxPoints.length; i++) {
        let vertex = new Victor(
            this.hitboxPoints[i].x,
            this.hitboxPoints[i].y
        );

        let projection = vertex.dot(axis);

        max = Math.max(max, projection);
        min = Math.min(min, projection);
    }

    return [min, max];
  }

  overlap(projA, projB){
    return projA[0] <= projB[1] && // Check if both extremes are overlapping 0 = min 1 = max
           projB[0] <= projA[1];
  }

  collide(rigidBody){
    if (this === rigidBody) return false; 
    let axes = [this.axes, rigidBody.axes].flat();

     for (let axisInfo of axes) {
        let axis = axisInfo.normal;
        let projectionA = this.project(axis);
        let projectionB = rigidBody.project(axis);

        if (!this.overlap(projectionA, projectionB)) {
            return false; // separating axis found
        }
    }

    return true; // no separating axis found, collision detected
  }

  getMTV(rigidBody) {
    if (this.collide(rigidBody) === false) {
        return null; // no collision
    }
    let smallestOverlap = Infinity;
    let smallestAxis = null;

    let axes = [
        this.axes,
        rigidBody.axes
    ].flat();

    for (let axisInfo of axes) {
       let axis = axisInfo.normal;
        let projA = this.project(axis);
        let projB = rigidBody.project(axis);

        let overlap = Math.min(projA[1], projB[1]) -
                      Math.max(projA[0], projB[0]);

        if (overlap <= 0) {
            return null; // no collision
        }

        if (overlap < smallestOverlap) {
            smallestOverlap = overlap;
            smallestAxis = axisInfo;
        }
    }

    let normal = smallestAxis.normal.clone();

let direction = rigidBody.center.clone().subtract(this.center);

if (direction.dot(normal) < 0) {
    normal.invert();
}

let tangent = new Victor(
    smallestAxis.edge.p2.x - smallestAxis.edge.p1.x,
    smallestAxis.edge.p2.y - smallestAxis.edge.p1.y
).normalize();

return {
    mtv: normal.clone().multiplyScalar(smallestOverlap),
    normal,
    tangent,
    edge: smallestAxis.edge
};


}
}

class Billboard extends RigidBody {
  constructor(x, y, forceCostume = null) {
    let img = null;
     if (forceCostume !== null && billboardImages[forceCostume]) {
    img = billboardImages[forceCostume];
  } else {
    img = getRandomImg(billboardImages);
  }
    super(x, y, 25, img, 1400, 1.4, 0, 133, 300, 50, 65);
  }
}

class TrashCan extends RigidBody {
  constructor(x, y, forceCostume = null){
    let img = null;
     if (forceCostume !== null && trashcanImages[forceCostume]) {
    img = trashcanImages[forceCostume];
  } else {
    img = getRandomImg(trashcanImages);
  }
  super(x, y, 7, img, 25, 0.9, 0, 4, 32, img.width*0.8, 60);
  this.constrained = false;
  }
}
  const redTime = 300;
  const yellowTime = 50;
  const greenTime = 250;

class TrafficLight extends RigidBody{
  constructor(x, y, forceCostume = null){
    let img = null;
     if (forceCostume !== null && trafficLightImages[forceCostume]) {
    img = trafficLightImages[forceCostume];
  } else {
    img = getRandomImg(trafficLightImages);
  }
  let xOffset = 0
  if (forceCostume >= 10 && forceCostume <= 12) xOffset = 115;

  super(x, y, 20, img, 250, 0.8, 0, 8 + xOffset, 125, 30, img.height*0.34);
  this.costumeOffset = 0;
  if ((forceCostume >=1 && forceCostume <=3) || (forceCostume >= 7 && forceCostume <= 12) ){
    this.changeLights = true;
    if (forceCostume>= 7 && forceCostume <=9){
      this.costumeOffset = 6;
    } else if (forceCostume >= 10) {
      this.costumeOffset = 9;
    }
    this.lightColor = forceCostume-this.costumeOffset;
    
  } else {
    this.changeLights = false;
  }

  this.ticks = 0;
  }
  update(){
    super.update();

    if(!this.changeLights || paused) return;

    if (this.lightColor === 1){
      this.ticks++;
       this.image = trafficLightImages[this.costumeOffset];
      if (this.ticks > redTime) {
        this.lightColor = 3;
        this.ticks = 0;
      } 
    } else

    if (this.lightColor === 2){
      this.ticks++;
      this.image = trafficLightImages[this.costumeOffset+1];
      if (this.ticks > yellowTime) {
        this.lightColor = 1;
        this.ticks = 0;
      } 
    } else

      if (this.lightColor === 3){
      this.ticks++;
      this.image = trafficLightImages[this.costumeOffset+2];
      if (this.ticks > greenTime) {
        this.lightColor = 2;
        this.ticks = 0;
      } 
    }
  }
}

class ThinBuildingArray {
  constructor(x, y, amount, space = 2){
    this.buildings = []
    for (let i = 0; i < amount; i++){
     this.buildings.push(new ThinBuilding((x - 403*i - space*i), y)); 
    }
  }

  getThinBuildings(){
    return this.buildings;
  }
}

class ThinBuilding extends RigidBody{
  constructor(x, y){  
    let img = new Image();
    img = getRandomImg(thinBuildings);
    super(x, img.height*0.9 + y, 16, img, 10000, 0.9, 0, 8, img.height*0.715, img.width*.95, img.height*0.2);
  }
}

class Barrier extends RigidBody {
  constructor(x, y, heading = 0, hitboxWidth = 20, hitboxHeight = 20) {
    
    super(x, y, 0, new Image(hitboxWidth, hitboxHeight), Infinity, 1, heading, 0, 0, hitboxWidth, hitboxHeight);
    this.fillColor = "blue";
  }
  
}

class FloatingObject extends CanvasObject {
  constructor(x, y, z, image, scale = 1, heading = 0) {
    if (new.target === FloatingObject) {
      throw new console.error("Cannot Instantiate Floating Object");
    }
    super(x, y, z, image, scale, heading);
  }


}

class PlayerCar extends RigidBody {
  constructor(x, y, image, heading = 0){
    super(x, y, 5, image, 45 , 1.1, heading);
    this.moveable = true;
    this.fillColor = "red";
    this.startX = x;
    this.startY = y;
    this.startHeading = heading;
    console.log("Created");
    
  }

  onLevelStart(point, heading){
    canvasObjects.push(this);
    rigidBodies.push(this);
    this.moveTo(point.x, point.y);
    this.rotateTo(heading);
    this.startX = point.x;
    this.startY = point.y;
    this.startHeading = heading;
    camera.setPos(this.x, this.y);
  }

  update(){
    if (paused){
      this.draw();
      this.drawHitbox();
      this.updatePolygonPos();
       return;
    }
    super.update();
    this.barrierContact();
  }

  barrierContact(){

    rigidBodies.forEach((rigidBody)=>{
      if(this.collide(rigidBody)){
         rigidBody.fillColor = "lime";
         
         
         let collision = this.getMTV(rigidBody);
        if (collision === null) return;
        rigidBody.onCollision(this);
        this.moveByVector(collision.mtv);
        
        let speed = this.velocity.dot(collision.tangent);

        this.velocity = collision.tangent
        .clone()
        .multiplyScalar(speed);

        this.contactRotation(collision);

        this.velocity.multiplyScalar(0.8);
      
         } else {
          if (rigidBody === this) return;
          rigidBody.fillColor = "blue";
         }
    });
  }

  contactRotation(collision){
    let angleDifference = RigidBody.angleDifference(this.heading, Math.abs(collision.tangent.angleDeg()));
    if (Math.abs(angleDifference) < 90) {
        this.rotateBy(-angleDifference * 0.1 * (this.speed * 0.4));
    } else {
     this.rotateBy(-angleDifference * 0.04 * (this.speed * 0.4)); 
    }
  }

  moveForward(units){
    this.x -= (units * Math.sin(toRadians(this.heading))); //units is negative because otherwise it goes backwards
    this.y += (units * Math.cos(toRadians(this.heading)));
  }

  moveBackward(units){
    this.moveForward(-units);
  }
  accelerate(amount) {
    let forward = new Victor(
        -Math.sin(toRadians(this.heading)),
         Math.cos(toRadians(this.heading))
    );

    this.velocity.add(
        forward.multiplyScalar(amount)
    );
}

  changeImage(newImageSrc){
    this.image = images[newImageSrc];
  }

}

class Background{
  constructor(image){
    this.backgroundImage = image;
    this.x = backgroundImage.width / 2 * BackgroundScaleFactor;
    this.y = backgroundImage.height / 2 * BackgroundScaleFactor;
    
  }


  get actualX() {
    return camera.x - this.x;
  }
  get actualY(){
    return camera.y - this.y;
  }

  draw(){
    this.x = backgroundImage.width / 2 * BackgroundScaleFactor;
    this.y = backgroundImage.height / 2 * BackgroundScaleFactor;
    ctx.drawImage(backgroundImage, this.actualX, this.actualY,  backgroundImage.width*BackgroundScaleFactor, backgroundImage.height*BackgroundScaleFactor);
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
    this.dx = 0;
    this.dy = 0;
  }

  update(){
    this.x += this.dx;
    this.dx = 0;
    this.y += this.dy;
    this.dy = 0;
  }

  setPos(x, y){
    this.x = x;
    this.y = y;
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
     // console.log("Mouse: ", -(event.offsetX - canvas.width/2 - this.x), -(event.offsetY - canvas.height/2 - this.y));
      if (!drag) return;
      this.dx += (event.offsetX - mouseX) * (1/this.zoom); //apply the difference to the camera
      this.dy += (event.offsetY - mouseY) * (1/this.zoom);
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

const camera = new Camera(10000, 10000);
let background = new Background(backgroundImage); 
function loop(){
  if (overlayActive || !panelActive) {
    updateOverlay();
   requestAnimationFrame(loop); //To Pause if Overlay is on
    return;
  } 
  updateOverlay();
 ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2, canvas.height / 2); // set center to (0,0)

    ctx.scale(camera.zoom, camera.zoom);
    camera.update();
    background.draw();
  canvasObjects.forEach((object) => {
    object.update();
  });
  
  requestAnimationFrame(loop);

}

let car = null;



async function startGame() {
  await preloadImages();
    new Level(backgroundImage, "Test", "This is a test Level", backgroundImage, new Point(500, 320), 90).addObjects(new Array(new Billboard(320, 320), new TrashCan(300, 40), new TrafficLight(532, 500, 1), ...new ThinBuildingArray(-315, 180, 5 , 10).buildings)).editStars(new Array(1,0,1));
    new Level(backgroundImage, "Test2", "This is a test Level", backgroundImage, new Point(-320, 0)).addObjects(new Array(new Billboard(320, 320), new Billboard(500, 320), new Billboard(320, 500)));
  
    car = new PlayerCar(
    500,
    40,
    images[`/images/Cars/${colorArray[0][0]}_Car1.png`], //have to do this weird arrangment so I can load all the images in first
    90
  );
  levels[currentLvl-1].activate();
  loop();
}


function toRadians(degrees){
  return degrees * (Math.PI/180);
}

function toDegrees(radians){
  return radians * (180/Math.PI);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomImg(imgArray){
  return imgArray[Math.floor(Math.random() * imgArray.length)];
}




function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}


function resizeCanvas() {
  canvas.width = panel.getBoundingClientRect().width*.87;
  canvas.height = panel.getBoundingClientRect().height*.82;
   panelOverlay.style.height = canvas.height + "px";
  let overlayCoverPose = -parseFloat(getComputedStyle(canvas).marginRight) + -canvas.width + -parseFloat(getComputedStyle(canvas).borderRight);
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
  if (overlayActive){
    panelOverlay.style.width = canvas.width + "px" ;
  } else {
    panelOverlay.style.width = 0;
  }
  if (overlayNum === 1){
    carChangeMenu.style.width = "";
    carChangeMenu.style.height = "";
    levelSelectorMenu.style.width = "0";
    levelSelectorMenu.style.height = "0";
  } else if(overlayNum === 2){
    levelSelectorMenu.style.width = "";
    levelSelectorMenu.style.height = "";
    carChangeMenu.style.width = "0";
    carChangeMenu.style.height = "0";
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

// Then create the player


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
  overlayActive = false;
  updateOverlay();
});
updateCarPreview();

carChangerButton.addEventListener("click", ()=>{
  if (overlayNum === 1){
    overlayActive = !overlayActive;
  } else {
    overlayActive = true;
    overlayNum = 1;
  }
  updateOverlay();
});

levelSelectorButton.addEventListener("click", ()=>{
  if (overlayNum === 2){
    overlayActive = !overlayActive;
  } else {
    overlayActive = true;
    overlayNum = 2;
  }
  updateOverlay();
});

playButton.addEventListener("click", () =>{
  paused = !paused;

  if (!paused){
    playButtonImg.src = "/images/Pause Icon.png";
  } else {
    playButtonImg.src = "/images/Play Icon.png";
  }
});

restartButton.addEventListener("click", ()=>{
  for (let rigidBody of rigidBodies){
    rigidBody.reset();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "i") {
    debugMode = !debugMode;
  }

  
});


startGame();