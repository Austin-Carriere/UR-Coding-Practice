import { Point, Segment, Polygon} from "https://cdn.jsdelivr.net/npm/@flatten-js/core/+esm";
import Victor from "https://cdn.jsdelivr.net/npm/victor@1.1.0/+esm";

const DIRECTION = {
  FORWARD: 0,
  BACKWARD: 1,
  LEFT: 2,
  RIGHT: 3
}
let levels = [];
let maxLvl = 1;
let currentLvl = 1;
let numBlocks = 0;
let timer = 0;
let fpsTimer = 0;
let fpsLastUpdate = performance.now();
let lastUpdateForTimer = performance.now();
let showWinAreaArrow = true;
const canvas = document.querySelector(".canvasPopup");
const panel = document.querySelector(".panel")
const ctx = canvas.getContext("2d");
const panelOverlay = document.querySelector(".canvasOverlay");
const levelContainer = document.querySelector(".levelsContainer");
const blockCounter = document.querySelector(".blockCounter");
const lockCamImg = document.querySelector("#lockView img");
const settingButton = document.querySelector(".settingsButton");
const settingsMenu = document.querySelector("#SettingsMenu");
const resetButton = document.querySelector(".resetButton");
const showArrowSetting = {
  selector: document.querySelector(".ShowArrow .selector"),
  options: document.querySelectorAll(".ShowArrow .option"),
  selectorCover: document.querySelector(".ShowArrow .selectorCover")
}
let levelSeen = false;
let settingsMenuActive = false;
const COLORS = {
    MOVEMENT: "#FFC800",   // Bright yellow
    LOGIC: "#8B3DFF",      // Bright purple
    OPERATORS: "#FF5252",  // Bright red
    LOOPS: "#39D353",      // Bright green
    SENSORS: "#ff0eef"     // Bright pink
};
let lockView = false;
let overlayNum = 1;
let backgroundImage = new Image();
backgroundImage.src = "/images/Enviorment Assets/Backgrounds/Background 1.png";
//1. Get query string
const queryString = window.location.search;

// 2. Parse the parameters
const urlParams = new URLSearchParams(queryString);

// 3. Extract your specific variables by their keys
currentLvl = urlParams.get('level'); 
if (currentLvl === null) currentLvl = 1;

let paused = false;
const BackgroundScaleFactor = 0.242;

let debugMode = false; //If true, will show hitboxes and other debug info

//-------------------Enviorment Asset Loader-------------------------
let billboardImages = [];
let trashcanImages = [];
let trafficLightImages = [];
let thinBuildings = [];
let images = {};
let WinMarkerImg = [];
let barrierImages = [];
let backgroundImages = [];  
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

    for (let i = 1; i <= 13; i++){
      promises.push(
        loadImage(`/images/Enviorment Assets/Buildings/Thin Buildings/Building${i}.png`)
      );
    }
    thinBuildings = await Promise.all(promises);

    promises = [];
    promises.push(loadImage("/images/WinAreaMarker.png"));
    promises.push(loadImage("/images/WinMarkerArrow.png"));
    WinMarkerImg = await Promise.all(promises);

    promises = [];

    for (let i = 1; i<=4; i++){
      promises.push(loadImage(`/images/Enviorment Assets/Barriers/Barrier${i}.png`));
    }

    barrierImages = await Promise.all(promises);

    promises = [];

    for (let i = 1; i<=1; i++){
      promises.push(loadImage(`/images/Enviorment Assets/Backgrounds/Background ${i}.png`));
    }
    backgroundImages = await Promise.all(promises);
};


const levelSelectorButton = document.getElementById("levelSelectorButton");
const playButton = document.getElementById("playButton");
const restartButton = document.getElementById("restartButton");
const playButtonImg = document.querySelector("#playButton img");
const WinScreen = {
  LevelNum: document.querySelector(".LevelNum"),
  stars: document.querySelectorAll(".star"),
  NextLevelButton: document.querySelector(".NextLevelButton"),
  LevelSelectButton: document.querySelector(".LevelSelectWinScreen"),
  ReturnButton: document.querySelector(".ReturnButton"),
  Star2Text: document.querySelector(".star2 div"),
  Star3Text: document.querySelector(".star3 div"),
}

WinScreen.NextLevelButton.addEventListener("click", ()=>{
  currentLvl++;
  levels[currentLvl-1].activate();
  deactivateWinScreen();
  restartLevel();
  paused = true;
  
});

WinScreen.LevelSelectButton.addEventListener("click", ()=>{
  console.log("Level Select Button Clicked");
  overlayNum = 2;
  updateOverlay();
});

WinScreen.ReturnButton.addEventListener("click", ()=>{
  deactivateWinScreen();
  restartLevel();
  paused = true;
});

class Level{
  constructor(backgroundImage, title, preview, maxBlocks, maxSeconds ,carStartPoint, heading = 0, backgroundScale = 0.8){
    levels.push(this);
    this.backgroundImage = backgroundImage;
    this.backgroundScale = backgroundScale;
    this.title = title;
    this.lvlNum = levels.indexOf(this) + 1;
    this.objectList = [];
    this.preview = preview;
    this.maxBlocks = maxBlocks;
    this.stars = [0,0,0];
    this.element = this.createElement();
    this.carStartPoint = carStartPoint;
    this.carStartHeading = heading;
    this.maxSeconds = maxSeconds;
  }

  editStars(array){
    for (let i=0; i < this.stars.length; i++){
       this.stars[i] = array[i];
    }
    this.updateStars();
  }

  static getAllStars(){
    let stars = [];
    for (let level of levels){
      stars.push(...level.stars);
    }
    return stars;
  }

  static assignStars(stars){
    let starArray = stars;
    for(let level of levels){
      level.editStars(new Array(starArray[0], starArray[1], starArray[2]))
      starArray = starArray.slice(3);
      level.updateStars();
    }
  }

  restart(){
    levelSeen = false;
    WinScreen.stars.forEach((star, index) => {
      star.classList.remove("starActive");
    });
  }

  finished(){
    console.log("Finished level ", this.lvlNum)
    console.log(maxLvl === this.lvlNum, typeof maxLvl, this.lvlNum)
     if (maxLvl === this.lvlNum) maxLvl+=1;
    console.log("MaxLvl", maxLvl)
    Level.updateLevelAvailability();
    this.editStars([1,(numBlocks <= this.maxBlocks) ? 1 : 0, (timer/1000 <= this.maxSeconds) ? 1 : 0]); //TODO: Still Need to add Timer and Star Trigger
   
    WinScreen.stars.forEach((star, index) => {
      if (this.stars[index] === 1){
        star.src = "/images/Star Full.png";
      }
    
   star.classList.add("starActive");
    })
    WinScreen.LevelNum.textContent = `Level ${this.lvlNum}`;
    WinScreen.Star2Text.textContent = `> ${this.maxBlocks} Blocks`;
    WinScreen.Star3Text.textContent = `> ${Math.floor(this.maxSeconds/60) + ":" + (this.maxSeconds % 60).toString().padStart(2, '0')}`;
    
  }

  static updateLevelAvailability(){
    for (let level of levels){
      level.element.classList.remove("locked");
      if (maxLvl < level.lvlNum){
        level.element.classList.add("locked");
      }
    level.updateStars();
  }
  
    
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

   activate(){
    background = new Background(this.backgroundImage, this.backgroundScale);
    camera.setBorder(this.backgroundImage.width * this.backgroundScale, this.backgroundImage.height * this.backgroundScale);
    levelSeen = false;
    save();
    workspace.clear();
    currentLvl = this.lvlNum;
    load();
    canvasObjects = [];
    rigidBodies = [];
    canvasObjects = this.objectList;
    for (let object of this.objectList){
      if (object instanceof RigidBody) rigidBodies.push(object);
    }
    
    car.onLevelStart(this.carStartPoint, this.carStartHeading);
    CanvasObject.sortCanvasObjects();
  } 

  createElement(){
    let template = document.querySelector(".LevelModuleTemplate");
    const module = template.content.cloneNode(true).querySelector(".LevelModule");
    const lvlNum = module.querySelector(".LevelModuleLvlNum");
    const title = module.querySelector(".LevelModuleTitle");
    const preview = module.querySelector(".LevelPreview img");
    const stars = module.querySelectorAll(".starContainer img");
    title.textContent = this.title;
    lvlNum.textContent = this.lvlNum;
    preview.setAttribute("src", this.preview.src);
    this.starsImage = stars;


    if (maxLvl < this.lvlNum){
      module.classList.add("locked");
    }

    module.addEventListener("click", ()=>{
      if (module.classList.contains("locked")) return;
      this.activate();
      overlayActive = false;
      updateOverlay();
      restartLevel();
      paused = true;
    });
    levelContainer.append(module);
    this.updateStars();
    return module;
  }

  
}


let overlayActive = false

class CanvasObject {
  //abstract
  constructor(x, y, image, scale = 1, heading = 0) {
    if (new.target === CanvasObject) {
      //Make sure you cannot create an instance of this class
      throw new Error("Cannot instantiate an abstract class directly.");
    }

    this.x = x;
    this.y = y;
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

  get bottomY(){
    return this.actualY - this.height
  }

  static sortCanvasObjects() {
    canvasObjects.sort((a, b) => {
        const aFloating = a instanceof FloatingObject;
        const bFloating = b instanceof FloatingObject;

        // FloatingObjects go last
        if (aFloating !== bFloating) {
            return aFloating ? 1 : -1;
        }

        // Tie-breaker: bottomY
        return a.bottomY - b.bottomY;
    });
    
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

}
let canvasObjects = [CanvasObject]; //Only Objects on the canvas

class FloatingObject extends CanvasObject {
  constructor(x, y, image, scale = 1, heading = 0) {
    if (new.target === FloatingObject) {
      throw new console.error("Cannot Instantiate Floating Object");
    }
    super(x, y, image, scale, heading);
  }


}
class ConcreteObject extends CanvasObject {
  constructor(x, y, image, scale = 1, heading = 0, hitboxXOffset = 0, hitboxYOffset = 0, hitboxWidth = image.width, hitboxHeight = image.height) {
    if (new.target === ConcreteObject) {
      throw new console.error("Cannot Instantiate Concrete Object");
    }
    super(x, y, image, scale, heading);
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

class RigidBody extends ConcreteObject {
  constructor(x, y, image, mass, scale = 1, heading = 0, hitboxXOffset = 0, hitboxYOffset = 0, hitboxWidth = image.width, hitboxHeight = image.height, ) {
    if (new.target === RigidBody) {
      throw new console.error("Cannot Instantiate Rigid Body");
    }
    super(x, y, image, scale, heading, hitboxXOffset, hitboxYOffset, hitboxWidth, hitboxHeight);
     this.startX = x;
    this.startY = y;
    this.startHeading = heading;
    this.velocity = new Victor(0, 0);
    this.collisionImmunity = 0;
    this.constrained = true;
    this.mass = mass;
    this.baseColor = "blue";
    this.fillColor = this.baseColor;
    this.k = 0.5;
    this.friction = 0.97;
    this.solid = true;
    }

    reset(){
    this.moveTo(this.startX, this.startY);
    this.rotateTo(this.startHeading);
    this.velocity = new Victor(0, 0);
  }

  changeStartPose(x, y, heading){
    this.startX = x;
    this.startY = y;
    this.startHeading = heading;
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
      if (this.constrained) {return;}
      for (let rigidBody of rigidBodies){
        if (!rigidBody.solid) {
          continue;
        }
        //Collision
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

      
         } else {
          if (rigidBody === this) return;
          rigidBody.fillColor = this.baseColor;
         }
         
        
        
      }
  }

  setVelocity(x, y){
    this.velocity = new Victor(x, y);
  }

  get speed(){
    return this.velocity.length() * 4;
  }

  setSpeed(speed){
    let forward = new Victor(
        -Math.sin(toRadians(this.heading)),
         Math.cos(toRadians(this.heading))
    );
    this.velocity = forward.multiplyScalar(speed);
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

accelerateTo(targetSpeed) {
  let sign = 1;
  if (targetSpeed < 0) {
    sign = -1;
    targetSpeed = Math.abs(targetSpeed);
  }
   const error = targetSpeed - this.speed;

    let normalized = Math.min(Math.pow(5, Math.abs(error))/70, 0.7);
    if (error > 1){
      normalized = Math.max(normalized, 0.2);
    }
    const throttle = Math.sign(error) * normalized * normalized;
    
    this.accelerate(throttle * sign);
}

rotateToward(heading, direction) {
    if (direction === DIRECTION.LEFT) {
        heading *= -1;
    }

    if (this.remainingRotation === 0) return;

    const maxSpeed = 2;
    const minSpeed = 0.3;

    // Slow down as we get close to the target
    let speed = Math.abs(this.remainingRotation) / 30;
    speed = Math.min(speed, maxSpeed);
    speed = Math.max(speed, minSpeed);

    const amount = speed;

    if (this.remainingRotation > 0) {
        this.rotateBy(amount);
        this.remainingRotation -= amount;
    } else {
        this.rotateBy(-amount);
        this.remainingRotation += amount;
    }
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

  within(projA, projB) {
    return (projA[0] >= projB[0] && projA[1] <= projB[1]) ||
           (projB[0] >= projA[0] && projB[1] <= projA[1]);
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

  inside(rigidBody){
     if (this === rigidBody) return false; 
    let axes = [this.axes, rigidBody.axes].flat();

     for (let axisInfo of axes) {
        let axis = axisInfo.normal;
        let projectionA = this.project(axis);
        let projectionB = rigidBody.project(axis);

        if (!this.within(projectionA, projectionB)) {
            return false; // not within
        }
    }

    return true; // within
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

  contactRotation(collision){
    let angleDifference = RigidBody.angleDifference(this.heading, Math.abs(collision.tangent.angleDeg()));
    if (Math.abs(angleDifference) < 90) {
        this.rotateBy(-angleDifference * 0.1 * (this.speed * 0.4));
    } else {
     this.rotateBy(-angleDifference * 0.04 * (this.speed * 0.4)); 
    }
  }
}
let rigidBodies = [RigidBody];

class Billboard extends RigidBody {
  constructor(x, y, forceCostume = null) {
    let img = null;
     if (forceCostume !== null && billboardImages[forceCostume]) {
    img = billboardImages[forceCostume];
  } else {
    img = getRandomImg(billboardImages);
  }
    super(x, y, img, 1400, 1.4, 0, 133, 323, 50, 45);
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
  super(x, y, img, 25, 0.9, 0, 4, 32, img.width*0.8, 60);
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

  super(x, y, img, 250, 0.8, 0, 8 + xOffset, 125, 30, img.height*0.34);
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
    let building = new ThinBuilding(0, 0);
    let xPose = x - building.width*i - space*i;
    let yPose = y+building.height;
    building.moveTo(xPose, yPose);
    building.changeStartPose(xPose, yPose, 0);
     this.buildings.push(building); 
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
    super(x, img.height*0.9 + y, img, 10000, 0.8, 0, 8, img.height*0.635, img.width*.95, img.height*0.2);
  }
}

class Barrier extends RigidBody {
  constructor(x, y, heading = 0, hitboxWidth = 20, hitboxHeight = 20) {
    
    super(x, y, new Image(hitboxWidth, hitboxHeight), Infinity, 1, heading, 0, 0, hitboxWidth, hitboxHeight);
  }
  
}

class VisibleBarrier extends RigidBody{
  constructor(x, y, direction, length){
    const otherLength = 50
    let width = otherLength;
    let height = otherLength;
    
    if (direction === DIRECTION.FORWARD || direction === DIRECTION.BACKWARD){
      width = length;
    } else {
      height = length;
    }

    super(x, y, new Image(width, height), Infinity, 1, 0, 0, 0, width, height);
    this.direction = direction;
    this.imageTemplate = barrierImages[direction];
  }

  update(){
    super.update()

  }

  draw(){
    ctx.save();
    ctx.translate(this.actualX + this.width / 2, this.actualY + this.height / 2 ); //this.width / 2 is center of the picture
    if (this.direction === DIRECTION.FORWARD || this.direction === DIRECTION.BACKWARD){
      let numOfPictures = Math.floor(this.width/96);
      for (let i = 0; i < numOfPictures; i++){
       ctx.drawImage(this.imageTemplate,  (-this.width / 2 + 96*i), (-this.height / 2), 96, 48); //Make it draw multiple need to put 96 and 48 to make sure size right
      }
    } else {
      if (this.direction === DIRECTION.LEFT) this.hitboxOffset = new Victor(15, 0);
      console.log(this.actualX, this.hitboxX)
      this.hitboxWidth = 75;
       let numOfPictures = Math.floor(this.height/70);
      for (let i = 0; i < numOfPictures; i++){
       ctx.drawImage(this.imageTemplate,  (-this.width / 2 ), (-this.height / 2 + (70*i)), 96, 96); //Make it draw multiple need to put 96 and 48 to make sure size right
      }
    }
    ctx.restore();
  }
}

class Obstacle extends Barrier{
  constructor(x, y, heading = 0, hitboxWidth = 20, hitboxHeight = 20){
    super(x, y, heading, hitboxWidth, hitboxHeight);
  }

  update(){
    super.update();
    if (this.collide(car)){
      paused = true;
      onFail("UR MOther")
    }
  }
}

class WinAreaMarker extends FloatingObject{
  constructor(winArea){
    super(winArea.x - winArea.width/2 + WinMarkerImg[0].width*0.08, winArea.y -winArea.height/2 + WinMarkerImg[0].height*0.08, WinMarkerImg[0], 0.16, 0)
    this.arrow = new WinAreaArrow(this);
}

  update(){

    super.update();

    const left = this.actualX;
    const right = this.actualX + this.width;

    const top = this.actualY;
    const bottom = this.actualY + this.height;

    const outOfView =
        right < -canvas.width / 2 ||     // completely left
        left > canvas.width / 2 ||        // completely right
        bottom < -canvas.height / 2 ||   // completely above
        top > canvas.height / 2;         // completely below

    if (outOfView) {
        if (!(showArrowChoosenSetting === 1 && levelSeen)) this.arrow.active = true;   //Do this so auto show arrow setting works
    } else {
      levelSeen = true;
      this.arrow.active = false;
    }
    this.arrow.update();
}



}

class WinAreaArrow extends FloatingObject{
  constructor(marker){
    super(0, 0, WinMarkerImg[1], 0.1, 0)
    this.marker = marker;
    this.active = false;
  }

  update(){
    if (this.active && showWinAreaArrow && showArrowChoosenSetting != 2){
      this.draw(this.EdgeScreenCords.x, this.EdgeScreenCords.y, this.EdgeHeading)
    }
  }

   draw(x, y, heading = 0) {
    ctx.save(); 
    ctx.translate(x, y); //this.width / 2 is center of the picture
    ctx.rotate(toRadians(heading));
    ctx.scale(1/camera.zoom, 1/camera.zoom)
    ctx.drawImage(this.image, (-this.width/2), (-this.height/2), this.width, this.height);
    ctx.restore();
  }
  
  get EdgeScreenCords(){
 let vector = new Victor(this.marker.actualX + this.marker.width/2, this.marker.actualY + this.marker.height/2);

const angle = vector.angle();
const angleDeg = toDegrees(angle);

const halfWidth = canvas.width / 2;
const halfHeight = canvas.height / 2;

// Angle from horizontal to the corner
const cornerAngle = toDegrees(
    Math.atan2(halfHeight, halfWidth)
);

if (Math.abs(angleDeg) <= cornerAngle) {

    // Right
    let x = halfWidth;
    let y = x * Math.tan(angle);

    return new Point(x/camera.zoom, y/camera.zoom);

} else if (Math.abs(angleDeg) >= 180 - cornerAngle) {

    // Left
    let x = -halfWidth;
    let y = x * Math.tan(angle);

    return new Point(x/camera.zoom, y/camera.zoom);

} else if (angleDeg > cornerAngle && angleDeg < 180 - cornerAngle) {

    // Bottom/top depending on your coordinate system
    let y = halfHeight ;
    let x = y / Math.tan(angle);

   return new Point(x/camera.zoom, y/camera.zoom);

} else {

    // Opposite vertical side
    let y = -halfHeight;
    let x = y / Math.tan(angle);

   return new Point(x/camera.zoom, y/camera.zoom);
}
}

get EdgeHeading(){
   let vector = new Victor(this.marker.actualX + this.marker.width/2 , this.marker.actualY + this.marker.height/2);
   return vector.angleDeg();
}
}
class WinArea extends RigidBody{
constructor(x, y, heading = 0, width = 100, height = 100, needsInside = false){
  super(x, y, new Image(width, height), Infinity, 1, heading, 0, 0, width, height);
  this.solid = false;
  this.needsInside = needsInside;
  this.fillColor = "yellow";
  this.baseColor = "yellow";
  this.marker = new WinAreaMarker(this);
  this.WinMarkerPackage = [this, this.marker];
}

  update(){
    super.update();
    ctx.strokeStyle = this.baseColor;
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.moveTo(this.hitboxPoints[0].x, this.hitboxPoints[0].y);

    for (let i = 1; i < this.hitboxPoints.length; i++) {
        ctx.lineTo(this.hitboxPoints[i].x, this.hitboxPoints[i].y);
    }

    ctx.closePath();
    ctx.stroke();
    if (this.needsInside){
      if (car.inside(this)){
        activateWinScreen();
        levels[currentLvl-1].finished();
      }
      return;
    }
  if (this.collide(car)){
    activateWinScreen();
    levels[currentLvl-1].finished();
  }
  }

}


class PlayerCar extends RigidBody {
  constructor(x, y, image, heading = 0){
    super(x, y, image, 45 , 1.3, heading);
    this.fillColor = "red";
    this.startX = x;
    this.startY = y;
    this.startHeading = heading;
    this.constrained=false;
    this.setSpeed = 25;
    this.remainingRotation = 0;
  }

  reset(){
    super.reset();
    this.setSpeed = 25;
  }

 isTouching(){
  for (let body of rigidBodies){
    if (this.collide(body) && body.solid){
      return true
    }
  }
    return false
 }

  onLevelStart(point, heading){
    if (canvasObjects.indexOf(this) === -1) { //Weird issue where car spawns again everytime you select a level
      canvasObjects.push(this);
      rigidBodies.push(this);
    }
    this.velocity = new Victor(0,0);
    this.moveTo(point.x, point.y);
    this.rotateTo(heading);
    this.startX = point.x;
    this.startY = point.y;
    this.startHeading = heading;
    camera.setPos(this.x, this.y);
  }

  get bottomY(){
    let smallestY = Infinity
    this.hitboxPoints.forEach((point) => {
      if (point.y < smallestY) smallestY = point.y
    })
    return smallestY;
  }

  update(){
    if (paused){
      this.draw();
      this.drawHitbox();
      this.updatePolygonPos();
       return;
    }
    super.update();
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
          rigidBody.fillColor = rigidBody.baseColor;
         }
    });
  }

  getSpeed(){
    return this.speed;
  }

  getSetSpeed(){
    return this.setSpeed;
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
  constructor(image, scale){
    this.backgroundImage = image;
    this.scale = scale;
    this.x = backgroundImage.width / 2 * scale;
    this.y = backgroundImage.height / 2 * scale;
    
  }


  get actualX() {
    return camera.x - this.x;
  }
  get actualY(){
    return camera.y - this.y;
  }

  draw(){
    this.x = backgroundImage.width / 2 * this.scale;
    this.y = backgroundImage.height / 2 * this.scale;
    ctx.drawImage(backgroundImage, this.actualX, this.actualY,  backgroundImage.width*this.scale, backgroundImage.height*this.scale);
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
    this.outOfBoundsCorrection();
    this.x += this.dx;
    this.dx = 0;
    this.y += this.dy;
    this.dy = 0;
    if (lockView) {
      this.x = car.x - car.width / 2;
      this.y = car.y - car.height / 2;
      lockCamImg.src = "/images/Lock Cam Active Icon.png";
    } else {
      lockCamImg.src = "/images/Lock Cam Icon.png";
    }
  }

  setPos(x, y){
    this.x = x;
    this.y = y;
  }

  outOfBoundsCorrection(){
    let canvasWidth = canvas.width/this.zoom/2;
    let canvasHeight = canvas.height/this.zoom/2;

    if (Math.abs(this.x) + canvasWidth > this.borderX/2){
      this.x = Math.min(this.borderX/2 - canvasWidth, Math.max(-this.borderX/2 + canvasWidth, this.x));
    }

    if (Math.abs(this.y) + canvasHeight > this.borderY/2){
      this.y = Math.min(this.borderY/2 - canvasHeight, Math.max(-this.borderY/2 + canvasHeight, this.y));
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
      lockView = false;
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
    this.zoom += -event.deltaY/1200
    this.zoom = Math.min(2.3, Math.max(0.7, this.zoom)); //Bound zoom
});

  }

  
}

const camera = new Camera(10000, 10000);
let background = null; 
function loop(){
  updateOverlay();
  if (overlayActive || !panelActive) {
    
    save();
    lastUpdateForTimer = performance.now();
   requestAnimationFrame(loop); //To Pause if Overlay is on
    return;
  } 
  if (!paused){
     timer += performance.now() - lastUpdateForTimer;
  } 
  lastUpdateForTimer = performance.now();
  fpsTimer = performance.now() - fpsLastUpdate;
  fpsLastUpdate = performance.now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2, canvas.height / 2); // set center to (0,0)

    ctx.scale(camera.zoom, camera.zoom);
    camera.update();
    CanvasObject.sortCanvasObjects();
    background.draw();
    canvasObjects.forEach((object) => {
    object.update();
  });
    const textSize = 0.8 * 40/camera.zoom
    let timerInSec = timer/1000;
    ctx.font = `bold ${textSize}px Arial`;
    ctx.fillStyle = "white";
    ctx.fillText(`${Math.floor(timerInSec/60) + ":" + (Math.floor(timerInSec % 60)).toString().padStart(2, '0')}`, -textSize, -canvas.height/(2.65 * camera.zoom) - textSize);
    if (debugMode){ 
      ctx.fillText(`${Math.round(1000/fpsTimer)} fps`, canvas.width/(3*camera.zoom), -canvas.height/(2.65 * camera.zoom) - textSize)
    }
    requestAnimationFrame(loop);

}


let car = null;



async function startGame() {
  await preloadImages();
    new Level(backgroundImages[0], "Test", backgroundImage, 10, 80, new Point(850, -700), 0)
    .addObjects(new Array(...new WinArea(60, 1100, 0, 360, 200, false).WinMarkerPackage,new Billboard(300, 570), new TrashCan(300, 270), new TrashCan(350, 270), ...new ThinBuildingArray(1500, 200, 4, 0).getThinBuildings(), 
    ...new ThinBuildingArray(690, -900, 6, 0).getThinBuildings(), new VisibleBarrier(1070, -900, DIRECTION.FORWARD, 400)));

    new Level(backgroundImages[0], "Test2", backgroundImage, 10, 80, new Point(-320, 0) ,  0)
    .addObjects(new Array(new WinArea(700, 400, 0, 200, 100),new Billboard(320, 320), new Billboard(500, 320), new Billboard(320, 500)));
    car = new PlayerCar(
    500,
    40,
    images[`/images/Cars/${colorArray[0][0]}_Car1.png`],
    90
  );
  levels[currentLvl-1].activate();
  lastUpdateForTimer = performance.now();
  load();
  loop();
  paused = true; //So it can draw the initial frame
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
const winScreen = document.getElementById("winScreen");
const failScreen = document.getElementById("failScreen");
const failScreenMessage = failScreen.querySelector(".failMessage");
const failRestartButton = failScreen.querySelector(".failRestartButton");
function updateOverlay(){
  disableAllOverlays();
  if (overlayActive){
    panelOverlay.style.width = canvas.width + "px" ;
  } else {
    panelOverlay.style.width = "0";
  }
  if (overlayNum === 1){
    carChangeMenu.style.width = "";
    carChangeMenu.style.height = "";
  } else if(overlayNum === 2){
    levelSelectorMenu.style.width = "";
    levelSelectorMenu.style.height = "";
  } else if (overlayNum === 3){
    winScreen.style.width = "";
    winScreen.style.height = "";
  } else if (overlayNum === 4){
    failScreen.style.width = "";
    failScreen.style.height = "";
  }


}

function disableAllOverlays(){
  carChangeMenu.style.width = "0";
  carChangeMenu.style.height = "0";
  levelSelectorMenu.style.width = "0";
  levelSelectorMenu.style.height = "0";
  winScreen.style.width = "0";
  winScreen.style.height = "0";
  failScreen.style.width = "0";
  failScreen.style.height = "0";
}

function onFail(message){
  overlayNum = 4;
  overlayActive = true;
  failScreenMessage.textContent = message
}

failRestartButton.addEventListener("click", restartLevel)

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
const lockViewButton = document.getElementById("lockView");

let colorIndex = 0;
let typeIndex = 0;

const colorArray = [
  ["Black", "Blue", "Gray", "Red", "White", "Yellow"],
  ["Black", "Orange", "Pink", "Yellow"],
  ["Black", "Red", "White", "Yellow"],
  ["Black", "Blue", "Red", "White"]
];

const typeArray = ["Truck", "Racer", "Mustang", "Corvette"];

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

function activateWinScreen(){
  overlayActive = true;
  overlayNum = 3;
  updateOverlay();
}

function deactivateWinScreen(){
  overlayActive = false;
  updateOverlay();
}

lockViewButton.addEventListener("click", ()=>{
  lockView = !lockView;
})


playButton.addEventListener("click", () =>{
  paused = !paused;

  if (!paused){
    playButtonImg.src = "/images/Pause Icon.png";
    runScript();
  } else {
    playButtonImg.src = "/images/Play Icon.png";
  }
  
});

restartButton.addEventListener("click", restartLevel);

function restartLevel(){
for (let rigidBody of rigidBodies){
    rigidBody.reset();
  }
  paused = true;
  timer = 0;
  lastUpdateForTimer = performance.now();
  scriptRunning = false;
  canRunScript = true;
  levels[currentLvl-1].restart();
  playButtonImg.src = "/images/Play Icon.png";
  overlayActive = false;
  disableAllOverlays();
}


window.addEventListener("keydown", (event) => {
  if (event.key === "i") {
    debugMode = !debugMode;
  }
  
});


startGame();

//----------------------StateMachine-------------------------
let states = [];
let behaviors = [];
let currentStateIndex = 0;
class State{
  constructor(){
    this.started = false;
    this.active = false;
    this.completed = false;
    this.elapsedTime = 0;
    this.lastUpdate = 0;
  }

  getElaspedTime(){
        if (paused) {
            // Don't accumulate time while paused.
            this.lastUpdate = performance.now();
            return;
        }

        const now = performance.now();
        this.elapsedTime += now - this.lastUpdate;
        this.lastUpdate = now;
    return this.elapsedTime;
  }

  get index(){
    return states.indexOf(this);
  }

  onFirstExecution(){
   this.lastUpdate = performance.now();
  }

  run(){
    if (!this.started) {
      this.onFirstExecution()
      this.started = true;
      this.active = true;
    }

    if (this.completed && this.active) this.onExit();
  }

  onExit(){
    this.active = false;
    currentStateIndex++;
    console.log("State Index ", currentStateIndex);
    console.log("EXITING STATE");
  }


}

class DriveState extends State{
  constructor(time, direction){
    super();
    this.time = time;
    this.direction = direction;
  }

  onFirstExecution(){
    super.onFirstExecution()
    this.lastUpdate = performance.now();
  }

  run(){ 
    super.run();
    if (this.getElaspedTime() >= (this.time() *1000)) this.completed = true;
    if (this.completed) return;
    if (this.direction === DIRECTION.FORWARD){
      car.accelerateTo(car.setSpeed)
    } else {
      car.accelerateTo(-car.setSpeed)
    }
  }

  onExit(){
    try {
      if (!(states[currentStateIndex+1] instanceof DriveState)) states.splice(this.index+1, 0, new BrakeState());
    } catch {} 
    super.onExit();
  }
}

class RotateState extends State{
  constructor(heading, direction){
    super();
    this.heading = null;
    this.direction = direction;
    this.getHeading = () => heading();
  }

  onFirstExecution(){
    super.onFirstExecution();
    this.heading = this.getHeading();
    this.startHeading = car.heading;

     if (this.direction === DIRECTION.LEFT) {
        car.remainingRotation = -this.heading;
    } else {
        car.remainingRotation = this.heading;
    }
  }

  run(){
    super.run();
    if (this.completed) return;
    car.rotateToward(this.heading ,this.direction)
    if (this.direction === DIRECTION.LEFT) {
        if (Math.abs((car.heading - (this.startHeading - this.heading))) < 0.2) this.completed = true;
    } else {
        if (Math.abs((car.heading - (this.startHeading + this.heading))) < 0.2) this.completed = true;
    }
  }


}

class SetSpeedState extends State{
  constructor(speed){
    super();
    this.speed = speed;
  }

  run(){
    super.run();
    car.setSpeed = this.speed();
    this.completed = true;
  }
}

class BrakeState extends State{
  constructor(){
    super();
    this.ticks = 5;
  }

  onFirstExecution(){
    behaviors.forEach((behavior) => {
      if(behavior instanceof DriveBehavior) behavior.completed = true;
    });
  }

  run(){
    super.run();
    if (this.completed) return;
    car.velocity.multiplyScalar(0.75);
    this.ticks--;
    if (this.ticks <= 0) this.completed = true;
  }


}

class AddDriveBehaviorState extends State{
  constructor(direction){
    super();
    this.direction = direction;
  }

  run(){
    this.completed = true;
    super.run();
    behaviors.push(new DriveBehavior(this.direction));
  }
}

class WaitState extends State{
  constructor(time){
    super();
    this.time = time;
  }

  run(){
    super.run();
    if (this.getElaspedTime() >= this.time()*1000) this.completed = true;
  }

}

class WaitUntilState extends State{
  constructor(condtion){
    super();
    this.condtion = condtion;
  }
  
  run(){
    super.run();
    if (this.completed) return;
    if (this.condtion()) this.completed = true;
  }
}

class IfState extends State{
  constructor(condition, ifStatement, elseIfArray, elseStatement){
    super();
    this.condition = condition;
    this.ifStatement = ifStatement;
    this.elseIfArray = elseIfArray;
    this.elseStatement = elseStatement;
    this.triggered = false;
  }

  onFirstExecution(){
    super.onFirstExecution();
    let otherStates = states.slice(this.index+1);
    states.splice(this.index+1);
    if (this.condition()){
      this.triggered = true;
      console.log(this.ifStatement)
      eval(this.ifStatement);
    } else {
      if (this.elseIfArray.length != 0 && !this.triggered){
        for (let i = 0; i < this.elseIfArray.length; i++){
          if (this.triggered) break;
          if (eval(this.elseIfArray[i][0])()){
            this.triggered = true;
            eval(JSON.parse(this.elseIfArray[i][1]));
            console.log(states)
          }
        }
      }

      if (!this.triggered && this.elseStatement != null){
        this.triggered=true;
        eval(this.elseStatement);
      }
    }

    states = states.concat(otherStates)
    this.completed = true;
  }


}

class RepeatState extends State{
  constructor(amount, statement, numOfStatements){
    this.amount = amount;
    this.statement = statement;
    this.numOfStatements = numOfStatements;
    this.loops = 0;
  }

  run(){
    if (this.loops >= Math.round(this.amount())) this.completed = true;
    super.run()
    if (this.completed) return;

    let otherStates = states.slice(this.index)
    states.splice(this.index);
    eval(this.statement);
    states = states.concat(otherStates);
    this.loops++;
    currentStateIndex = this.index - this.numOfStatements;
  }

}

class RepeatUntilState extends State{
constructor(condition, statement, numOfStatements, mode){
  super();
    if (mode === "WHILE"){
      this.condition = () => !condition(); //Flip to make it return false if true
    } else {
      this.condition = condition
    }
    this.statement = statement;
    this.numOfStatements = numOfStatements;
  }

  run(){
    console.log(this.condition());
    if (this.condition()) this.completed = true;
    super.run()
    if (this.completed) return;
    let otherStates = states.slice(this.index)
    states.splice(this.index);
    eval(this.statement);
    states = states.concat(otherStates);
    currentStateIndex = this.index - this.numOfStatements;
  }
}

//----------------------Behaviors-----------------------
class Behavior{
  constructor(){
    this.completed = false;
    this.started = false;
  }

  onFirstExecution(){};

  execute(){
    if (this.started === false){
      this.started = true;
      this.onFirstExecution()
    }

    if (this.completed){
      this.onExit();
      const index = behaviors.indexOf(this);
      if (index > -1) { // only splice array when item is found
          behaviors.splice(index, 1); // Remove this
      }
    } 
  }
  
  onExit(){};
}

class DriveBehavior extends Behavior{
  constructor(direction){
    super();
    this.direction = direction;
  }

  execute(){
    super.execute();
    if (this.direction === DIRECTION.FORWARD){
      car.accelerateTo(car.setSpeed)
    } else {
      car.accelerateTo(-car.setSpeed)
    }
  }

}

//----------------------Blockly-----------------------
//----------------------Block Definitions------------------
  const operators_compare = {
  init: function () {
    this.appendValueInput("A")
        .setCheck("Number");

    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
            ["=", "EQ"],
            ["≠", "NEQ"],
            ["<", "LT"],
            ["≤", "LTE"],
            [">", "GT"],
            ["≥", "GTE"]
        ]), "OP");

    this.appendValueInput("B")
        .setCheck("Number");

    this.setInputsInline(true);

    this.setOutput(true, "Boolean");

    this.setTooltip("Compare two numbers.");
    this.setStyle("operator_blocks");
  }
};
Blockly.common.defineBlocks({operators_compare: operators_compare});

javascript.javascriptGenerator.forBlock["operators_compare"] = function (block, generator) {

    const left = generator.valueToCode(
        block,
        "A",
        javascript.Order.RELATIONAL
    ) || 0;

    const right = generator.valueToCode(
        block,
        "B",
        javascript.Order.RELATIONAL
    ) || 0;

    const op = {
        EQ: "==",
        NEQ: "!=",
        LT: "<",
        LTE: "<=",
        GT: ">",
        GTE: ">="
    }[block.getFieldValue("OP")];

    return [`${left} ${op} ${right}`, javascript.Order.RELATIONAL];
};

javascript.javascriptGenerator.forBlock['controls_if'] = function(block, generator) {
    // Get the condition
    const condition = generator.valueToCode(
        block,
        'IF0',
        javascript.Order.NONE
    );

    // Get the statements inside the IF
    const ifBody = generator.statementToCode(
        block,
        'DO0'
    );
    let elseIfArray = [];
    let i = 1;

    while (block.getInput(`IF${i}`)) {
    const elseCondition = generator.valueToCode(block, `IF${i}`, javascript.Order.NONE);
    const body = generator.statementToCode(block, `DO${i}`);
      elseIfArray.push([`() => ${elseCondition}`, JSON.stringify(body)]);
    i++;
    }
    let elseBody = null;
    try{
      elseBody = generator.statementToCode(block, "ELSE");
    } catch {}
    console.log("Elif Array: ", JSON.stringify(elseIfArray));
      
    const code = `states.push(new IfState(()=> ${condition}, ${JSON.stringify(ifBody)}, ${JSON.stringify(elseIfArray)}, ${JSON.stringify(elseBody)}))\n`;

    return code;
};

javascript.javascriptGenerator.forBlock['controls_repeat'] = function(block, generator) {
    const amount = generator.valueToCode(
        block,
        'TIMES',
        javascript.Order.NONE
    );

    const statement = generator.statementToCode(
        block,
        'DO'
    );

  const firstBlock = block.getInputTargetBlock('DO');

    let numOfStatements = 0;
    let currentBlock = firstBlock;

    while (currentBlock) {
    numOfStatements++;
    currentBlock = currentBlock.getNextBlock();
}   

    return `states.push(new RepeatState(
        () =>${amount},
        ${JSON.stringify(statement)},
        ${numOfStatements}
    ))\n`;
};

javascript.javascriptGenerator.forBlock['controls_whileUntil'] = function(block, generator) {
    const condition = generator.valueToCode(
        block,
        'BOOL',
        javascript.Order.NONE
    );

    const mode = block.getFieldValue('MODE');

    const statement = generator.statementToCode(
        block,
        'DO'
    );

    // Count only top-level statements
    let numOfStatements = 0;
    let currentBlock = block.getInputTargetBlock('DO');

    while (currentBlock) {
        numOfStatements++;
        currentBlock = currentBlock.getNextBlock();
    }

    return `states.push(new RepeatUntilState(
        () => ${condition},
        ${JSON.stringify(statement)},
        ${numOfStatements},
        ${JSON.stringify(mode)}
    ))\n`;
};

  const operators_math  = {
  init: function () {

    this.appendValueInput("A")
        .setCheck("Number");

    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
            ["+", "ADD"],
            ["−", "MINUS"],
            ["×", "MULTIPLY"],
            ["÷", "DIVIDE"],
            ["^", "POWER"]
        ]), "OP");

    this.appendValueInput("B")
        .setCheck("Number");

    this.setInputsInline(true);

    this.setOutput(true, "Number");

    this.setTooltip("Perform any math operation.");
    this.setStyle("operator_blocks");
  }
};
Blockly.common.defineBlocks({operators_math: operators_math});

javascript.javascriptGenerator.forBlock["operators_math"] = function (block, generator) {
   const left = javascript.javascriptGenerator.valueToCode(
        block,
        "A",
        javascript.Order.ADDITION
    ) || 0;

    const right = javascript.javascriptGenerator.valueToCode(
        block,
        "B",
        javascript.Order.ADDITION
    ) || 0;

    const op = {
        ADD: "+",
        MINUS: "-",
        MULTIPLY: "*",
        DIVIDE: "/",
        POWER: "**"
    }[block.getFieldValue("OP")];

    return [`${left} ${op} ${right}`, javascript.Order.ADDITION];
}

const operators_operation  = {
    init: function () {

        this.appendValueInput("A")
            .setCheck("Boolean");

        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["and", "AND"],
                ["or", "OR"]
            ]), "OP");

        this.appendValueInput("B")
            .setCheck("Boolean");

        this.setInputsInline(true);

        this.setOutput(true, "Boolean");

        this.setTooltip("Combine two conditions.");
        this.setStyle("operator_blocks");
    }
};
Blockly.common.defineBlocks({operators_operation: operators_operation});

javascript.javascriptGenerator.forBlock["operators_operation"] = function(block, generator) {

    const left =
        generator.valueToCode(
            block,
            "A",
            javascript.Order.LOGICAL_AND
        ) || "false";

    const right =
        generator.valueToCode(
            block,
            "B",
            javascript.Order.LOGICAL_AND
        ) || "false";

    const op = {
        AND: "&&",
        OR: "||"
    }[block.getFieldValue("OP")];

    const order =
        op === "&&"
            ? javascript.Order.LOGICAL_AND
            : javascript.Order.LOGICAL_OR;

    return [`${left} ${op} ${right}`, order];
};

const operators_negate = {
  init: function () {
    this.appendValueInput("BOOL")
        .setCheck("Boolean")
        .appendField("not");

    this.setOutput(true, "Boolean");

    this.setStyle("operator_blocks");
    this.setTooltip("Returns the opposite of a boolean value");
    this.setHelpUrl("");
  }
};
Blockly.common.defineBlocks({operators_negate: operators_negate});
javascript.javascriptGenerator.forBlock["operators_negate"] = function(block, generator) {
  const value = generator.valueToCode(
    block,
    "BOOL",
    javascript.Order.NONE
  ) || "false";

  return [`!(${value})`, javascript.Order.LOGICAL_NOT];
};

const loops_wait = {
  init: function() {
    this.appendValueInput('seconds')
    .setCheck('Number')
      .appendField('wait for');
    this.appendDummyInput('end_text')
      .appendField('seconds');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('The car waits for a certain amount of time');
    this.setHelpUrl('');
    this.setColour(120);
  }
};
Blockly.common.defineBlocks({loops_wait: loops_wait});
javascript.javascriptGenerator.forBlock['loops_wait'] = function(block, generator) {
  // TODO: change Order.ATOMIC to the correct operator precedence strength
  const value_seconds = generator.valueToCode(block, 'seconds', javascript.Order.ATOMIC);


  // TODO: Assemble javascript into the code variable.
  const code = `states.push(new WaitState(() => ${value_seconds}))\n`;
  return code;
}

const logic_waitUntil = {
  init: function() {
    this.appendValueInput('CONDITION')
    .setCheck('Boolean')
      .appendField('wait until');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Wait until the give condition is true');
    this.setHelpUrl('');
    this.setStyle("logic_blocks");
  }
};
Blockly.common.defineBlocks({logic_waitUntil: logic_waitUntil});
                    
javascript.javascriptGenerator.forBlock['logic_waitUntil'] = function(block, generator) {
  // TODO: change Order.ATOMIC to the correct operator precedence strength
  const value_condition = generator.valueToCode(block, 'CONDITION', javascript.Order.ATOMIC);

  // TODO: Assemble javascript into the code variable.
  const code = `states.push(new WaitUntilState(() => ${value_condition}))\n`;
  return code;
}

const start_block = {
  init: function() {
    this.appendDummyInput('text')
      .appendField(new Blockly.FieldImage('/images/Play Icon.png', 15, 15, '*'))
      .appendField('On start');
    this.setInputsInline(true)
    this.setNextStatement(true, null);
    this.setTooltip('Everything attached to this will run on start');
    this.setHelpUrl('');
    this.setColour(120);
  }
};
Blockly.common.defineBlocks({start_block: start_block});
javascript.javascriptGenerator.forBlock['start_block'] = function(block, generator) {
  // TODO: Assemble javascript into the code variable.
  const code = '';
  return code;
}
  
  const movement_drive = {
  init: function() {
    this.appendDummyInput('moveseconds')
      .appendField(new Blockly.FieldDropdown([
          ['move forward', 'Forward'],
          ['move backward', 'Backward']
        ]), 'moveOption')
      .appendField(new Blockly.FieldLabelSerializable('for'), 'middle_text_label');
    this.appendValueInput('seconds')
    .setCheck('Number');
    this.appendDummyInput('end_text')
      .appendField('seconds');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Move the car forward or backwards for a certain amount of time');
    this.setHelpUrl('');
    this.setColour(COLORS.MOVEMENT);
  }
};
Blockly.common.defineBlocks({movement_drive: movement_drive});
javascript.javascriptGenerator.forBlock['movement_drive'] = function(block, generator) {
  const dropdown_moveoption = block.getFieldValue('moveOption');
  const number_seconds = generator.valueToCode(block, 'seconds', Blockly.JavaScript.ORDER_ATOMIC);
  let direction = null;
  if (dropdown_moveoption === 'Forward') {
    direction = DIRECTION.FORWARD;
  } else  {
    direction = DIRECTION.BACKWARD;
  }
  // TODO: Assemble javascript into the code variable.
  const code = `states.push(new DriveState(() => ${number_seconds}, ${direction}))\n`;
  return code;
}

  const movement_turn = {
  init: function() {
    this.appendDummyInput('turn_query')
      .appendField(new Blockly.FieldDropdown([
          ['turn right', 'R'],
          ['turn left', 'L']
        ]), 'turn_direction');
    this.appendValueInput('degrees')
    .setCheck('Number');
    this.appendDummyInput('end_text')
    .appendField('degrees')
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('turn the car left or right for a set amount of degrees');
    this.setColour(COLORS.MOVEMENT);
  }
};
Blockly.common.defineBlocks({movement_turn: movement_turn});
javascript.javascriptGenerator.forBlock['movement_turn'] = function(block, generator) {
  const dropdown_turn_direction = block.getFieldValue('turn_direction');
  const value_degress = generator.valueToCode(block, 'degrees', javascript.Order.ATOMIC);
  let direction = null;
  if (dropdown_turn_direction === "R"){
    direction = DIRECTION.RIGHT;
  } else {
    direction = DIRECTION.LEFT; 
  }
  const code = `states.push(new RotateState(()=>${value_degress}, ${direction}))\n`;
  return code;
}

const movement_speed = {
  init: function() {
    this.appendValueInput('speed')
    .setCheck('Number')
      .appendField('set speed to');
    this.appendDummyInput('text')
      .appendField('mph');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('set your target speed to a certain number');
    this.setColour(COLORS.MOVEMENT);
  }
};
Blockly.common.defineBlocks({movement_speed: movement_speed});
javascript.javascriptGenerator.forBlock['movement_speed'] = function(block, generator) {
  // TODO: change Order.ATOMIC to the correct operator precedence strength
  const value_speed = generator.valueToCode(block, 'speed', javascript.Order.ATOMIC);

  // TODO: Assemble javascript into the code variable.
  const code = `states.push(new SetSpeedState(() => ${value_speed}))\n`;
  return code;
}  

const movement_moveForward = {
  init: function() {
    this.appendDummyInput('directionField')
      .appendField(new Blockly.FieldDropdown([
          ['move forward', 'FWD'],
          ['move backward', 'BWD']
        ]), 'direction');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Move forward/backward without stopping until "brake" is run');
    this.setHelpUrl('');
    this.setColour(COLORS.MOVEMENT);
  }
};
Blockly.common.defineBlocks({movement_moveForward: movement_moveForward});
javascript.javascriptGenerator.forBlock['movement_moveForward'] = function(block, generator) {
  const dropdown_name = block.getFieldValue('direction');
  let direction = null;
  if (dropdown_name === "FWD") {
    direction = DIRECTION.FORWARD;
  } else {
    direction = DIRECTION.BACKWARD;
  }
  // TODO: Assemble javascript into the code variable.
  const code = `states.push(new AddDriveBehaviorState(${direction}))\n`;
  return code;
}   

const movement_brake = {
  init: function() {
    this.appendDummyInput('text')
      .appendField('brake');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Stops the car immediately');
    this.setHelpUrl('');
    this.setColour(COLORS.MOVEMENT);
  }
};
Blockly.common.defineBlocks({movement_brake: movement_brake});
javascript.javascriptGenerator.forBlock['movement_brake'] = function(block, generator) {
  const code = 'states.push(new BrakeState())\n';
  return code;
}
                    
const sensors_trafficLight = {
  init: function() {
    this.appendDummyInput('lightColor')
      .appendField(new Blockly.FieldDropdown([
         ['is traffic light red ?', 'R'],
          ['is traffic light yellow ?', 'G'],
          ['is traffic light green ?', 'B'],
          ['is traffic light not present ?', 'NA']
        ]), 'lightColor');
    this.setTooltip('returns true if the traffic light (needs to be close) is on the selected light');
    this.setHelpUrl('');
    this.setColour(COLORS.SENSORS);
    this.setOutput(true, "Boolean");

  }
};
Blockly.common.defineBlocks({sensors_trafficLight: sensors_trafficLight});
                    
  javascript.javascriptGenerator.forBlock['sensors_trafficLight'] = function(block, generator) {
  const dropdown_name = block.getFieldValue('lightColor');

  // TODO: Assemble javascript into the code variable.
  const code = '...';
  return code;
}    

const sensors_getSpeed = {
  init: function() {
    this.appendDummyInput('text')
      .appendField('current speed (mph)');
    this.setInputsInline(true)
    this.setTooltip('returns the car\'s current speed (e.g. stopped = 0)');
    this.setHelpUrl('');
    this.setColour(COLORS.SENSORS);
    this.setOutput(true, "Number");
  }
};
Blockly.common.defineBlocks({sensors_getSpeed: sensors_getSpeed});
javascript.javascriptGenerator.forBlock['sensors_getSpeed'] = function(block, generator) {
  // TODO: Assemble javascript into the code variable.
  const code = 'car.getSpeed()';
  return [code, javascript.Order.ATOMIC];
}

const sensors_getMaxSpeed = {
  init: function() {
    this.appendDummyInput('text')
      .appendField('set speed (mph)');
    this.setInputsInline(true)
    this.setTooltip('returns the car\'s set speed (e.g. if the car is stopped and you set its speed to 20mph it will return 20');
    this.setHelpUrl('');
    this.setColour(COLORS.SENSORS);
    this.setOutput(true, "Number");
  }
};
Blockly.common.defineBlocks({sensors_getMaxSpeed: sensors_getMaxSpeed});
javascript.javascriptGenerator.forBlock['sensors_getMaxSpeed'] = function(block, generator) {

  // TODO: Assemble javascript into the code variable.
  const code = 'car.getSetSpeed()';
  return [code, javascript.Order.ATOMIC];
}

const sensors_isTouching = {
  init: function() {
    this.appendDummyInput('text')
      .appendField('is touching something?');
    this.setTooltip('returns true if contacting a solid object');
    this.setHelpUrl('');
    this.setColour(COLORS.SENSORS);
    this.setOutput(true, "Boolean")
  }
};
Blockly.common.defineBlocks({sensors_isTouching: sensors_isTouching});
javascript.javascriptGenerator.forBlock['sensors_isTouching'] = function() {

  // TODO: Assemble javascript into the code variable.
  const code = 'car.isTouching()';
  return [code, javascript.Order.ATOMIC];
}                    



const toolbox = {
  kind: "categoryToolbox",
    contents: [
        {
    kind: "category",
    name: "Movement",
    colour: COLORS.MOVEMENT,
    contents: [
     {
        kind: "block",
        type: "movement_drive",
        inputs: {
        seconds: {
              shadow: {
                type: "math_number",
                  fields: {
                  NUM: 0
                    }
      }
    }
    }
      }, 
      {
        kind: "block", 
        type: "movement_turn",
        inputs: {
          degrees: numberShadow(0)
    }
      },
      {
        kind: "block",
        type: "movement_speed",
        inputs: {
          speed: numberShadow(0)
        }
      },
      {
        kind: "block",
        type: "movement_moveForward"
      },
      {
        kind: "block",
        type: "movement_brake"
      }
    ]
},
{
    kind: "category",
    name: "Logic",
    colour: COLORS.LOGIC,
    contents: [
                {
                    kind: "block",
                    type: "logic_boolean"
                }, 
                {
                  kind: "block",
                  type: "controls_if"
                }, 
                {
                  kind: "block",
                  type: "logic_waitUntil"
                }
            ]
},
{
    kind: "category",
    name: "Operators",
    colour: COLORS.OPERATORS,
    contents: [
                {
                    kind: "block",
                    type: "operators_math",
                    inputs: {
        A: numberShadow(0),
        B: numberShadow(0)
                      },
                }, 
                {
                  kind: "block",
                  type: "operators_operation"
                }, 
                {
    kind: "block",
    type: "operators_compare",
    inputs: {
        A: numberShadow(0),
        B: numberShadow(0)
        }
                },
                {
                  kind: "block",
                  type: "operators_negate"      
                }
              ]
},
{
    kind: "category",
    name: "Loops",
    colour: COLORS.LOOPS,
    contents: [ {
                  kind: "block", 
                  type: "start_block"
                },
                {
                  kind: "block",
                  type: "loops_wait",
                  inputs: {
                    seconds: numberShadow(0)
                  }
                },
                {
                    kind: "block",
                    type: "controls_repeat_ext",
                    inputs: {
                      TIMES: numberShadow(0)
                    }

                },
                {
                    kind: "block",
                    type: "controls_whileUntil"
                }
                ]
},
{
    kind: "category",
    name: "Sensors",
    colour: COLORS.SENSORS,
    contents: [
      {
        kind: "block",
        type: "sensors_trafficLight"
      },
      {
        kind: "block",
        type: "sensors_getSpeed"
      },
      {
        kind: "block", 
        type: "sensors_getMaxSpeed"
      },
      {
        kind: "block",
        type: "sensors_isTouching"
      }
    ]
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

     blockStyles: {
        logic_blocks: {
            colourPrimary: "#8B3DFF",
            colourSecondary: "#7630E0",
            colourTertiary: "#6126C2"
        },

        operator_blocks: {
            colourPrimary: "#FF5252",
            colourSecondary: "#E64545",
            colourTertiary: "#CC3838"
        },

        Sensors: {
            colourPrimary: "#FF5252",
            colourSecondary: "#E64545",
            colourTertiary: "#CC3838"
        }
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
     renderer: "zelos",
     zoom: {
    controls: true,
    wheel: true,
    startScale: 0.9,   // Default is 1.0
    maxScale: 1.6,
    minScale: 0.5,
    scaleSpeed: 1.2
  }
});

const generator = javascript.javascriptGenerator;

generator.init(workspace);

function numberShadow(value = 0) {
    return {
        shadow: {
            type: "math_number",
            fields: {
                NUM: value
            }
        }
    };
}
let scriptRunning = false;
let canRunScript = true; //This is to make sure you clicked reset before running the script again
function runScript() {
  if (scriptRunning || !canRunScript) return;
  scriptRunning = true;
  canRunScript = false;
  
  currentStateIndex = 0;
  states = [];
  const topBlocks = workspace.getTopBlocks();

  const startBlock = topBlocks.find(
        block => block.type === "start_block"
    );
  const code = generator.blockToCode(startBlock);
  console.log(code);
  eval(code);
  console.log(states);
  scriptLoop();
}
function scriptLoop() {
  if (paused){
    requestAnimationFrame(scriptLoop);
    return;
  } 

  //running the state
  if ((currentStateIndex >= states.length && behaviors.length === 0) || !scriptRunning){ 
    scriptRunning = false;
    console.log("Script finished");
    return;
  };
  if (states.length > currentStateIndex) {
    states[currentStateIndex].run();
  } else {
    console.log("No more states to run, waiting for behaviors to finish");
  }
  behaviors.forEach((behavior) => {
    behavior.execute();
  });
 requestAnimationFrame(scriptLoop);
}
const panelContainer = document.getElementById("panelContainer");
const pannelButton = document.getElementById("panelButton");
const panelArrow = document.getElementById("panelArrow");
let panelActive = false;

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
  
workspace.addChangeListener(() => {
    numBlocks = workspace.getAllBlocks().filter(block => !block.isShadow()).length;
    blockCounter.textContent = `Blocks: ${numBlocks}`;
});

function save(){
  let state = Blockly.serialization.workspaces.save(workspace);
  localStorage.setItem(`level${currentLvl}`, JSON.stringify(state));
  localStorage.setItem("maxLevel", maxLvl);
  localStorage.setItem("stars", JSON.stringify(Level.getAllStars()))
  localStorage.setItem("currentLvl", currentLvl);
}

function load(){
  if (performance.getEntriesByType("navigation")[0].type === "reload") {
  currentLvl = JSON.parse(localStorage.getItem("currentLvl"))
 }
  Level.updateLevelAvailability();
  const state = JSON.parse(localStorage.getItem(`level${currentLvl}`));
  if (state === null) {
    console.log("New Save", state);
    return;
  }
     Blockly.serialization.workspaces.load(state, workspace);
  maxLvl = JSON.parse(localStorage.getItem("maxLevel"));
  Level.assignStars(JSON.parse(localStorage.getItem("stars")));

 

}

load();
function clearSavedData(){
  maxLvl = 1
  for (let level of levels){
    level.editStars(new Array(0,0,0));
    level.updateStars
  }
  Level.updateLevelAvailability();
  workspace.clear();
  localStorage.clear();
}

let resetVerified = false;

settingButton.addEventListener("click", ()=>{
  settingsMenuActive = !settingsMenuActive;

  if (settingsMenuActive){
    console.log(window.innerWidth);
    settingsMenu.style.left = `${window.innerWidth - 395}px`
    settingsMenu.style.height = "400px"
    settingsMenu.style.width= "350px"
    settingsMenu.style.border = "5px solid #2d436b"
    settingsMenu.style.padding = "15px";
  } else {
    settingsMenu.style.border = "none"
     settingsMenu.style.height = "0"
    settingsMenu.style.width= "0"
    settingsMenu.style.padding = "0";
    resetVerified = false;
    resetButton.textContent = "RESET"
  }
})

resetButton.addEventListener("click", ()=>{
  if (resetVerified){
    resetButton.textContent = "RESET"
    resetVerified = false;
    clearSavedData();
  } else {
    resetButton.textContent = "Are you sure?"
    resetVerified = true;
  }
})
let showArrowChoosenSetting = 0; //0=yes, 1= auto, 2=no
for (let option of showArrowSetting.options){
  option.addEventListener("click", ()=>{
    if (option.textContent === "Yes"){
      showArrowChoosenSetting = 0;
      showArrowSetting.selectorCover.style.width = `${option.getBoundingClientRect().width}px`;
      showArrowSetting.selectorCover.style.left = "0px";
    } else if (option.textContent === "Auto"){
      console.log("TEST")
      showArrowChoosenSetting = 1;
      showArrowSetting.selectorCover.style.width = `${option.getBoundingClientRect().width}px`;
      showArrowSetting.selectorCover.style.left = `${showArrowSetting.options[0].getBoundingClientRect().width}px`;
    } else {
      showArrowChoosenSetting = 2;
      showArrowSetting.selectorCover.style.width = `${option.getBoundingClientRect().width}px`;
      showArrowSetting.selectorCover.style.left = `${showArrowSetting.options[0].getBoundingClientRect().width + showArrowSetting.options[1].getBoundingClientRect().width}px`;
    }
  });
}