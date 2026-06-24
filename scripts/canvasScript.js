import { Point, Segment, Polygon } from '@flatten-js/core';

const canvas = document.querySelector("canvas");
const panel = document.querySelector(".panel")
const ctx = canvas.getContext("2d");


let canvasObjects = []; //Store one copy of everything on the canvas

class CanvasObject {
  //abstract
  constructor(x, y, z, image, width, height, heading = 0) {
    if (new.target === CanvasObject) {
      //Make sure you cannot create an instance of this class
      throw new Error("Cannot instantiate an abstract class directly.");
    }
    canvasObjects.push(this);

    this.x = x;
    this.y = y;
    this.z = z;
    this.image = image;
    this.width = width;
    this.height = height;
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
    ctx.rotate(this.heading * (Math.PI / 180));
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
  constructor(x, y, z, image, width, height, heading) {
    if (new.target === ConcreteObject) {
      throw new console.error("Cannot Instantiate Concrete Object");
    }
    super(x, y, z, image, width, height, heading);
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
  constructor(x, y, z, image, heading) {
    if (new.target === FloatingObject) {
      throw new console.error("Cannot Instantiate Floating Object");
    }
    super(x, y, z, image, image.width, image.height, heading);
  }


}

class PlayerCar extends ConcreteObject {
  constructor(x, y, image){
    super(x, y, 20, image, image.width, image.height, 0);
  }

  update(){
    super.update()
    this.rotateBy(1);
  }

  rotateBy(degrees) {
    this.heading += degrees;
  }

  rotateTo(degress) {
    this.heading += degress;
  }

  moveTo(x, y){
    this.x = x;
    this.y = y;
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
      console.log(this.zoom);
    this.zoom = Math.min(2.3, Math.max(0.7, this.zoom)); //Bound zoom
});

  }

  
}

const camera = new Camera(800, 800);


function loop(){
 ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2, canvas.height / 2); // set center to (0,0)

    ctx.scale(camera.zoom, camera.zoom);
  canvasObjects.forEach((object) => {
    object.update();
  });
  requestAnimationFrame(loop);

}

const carImage = new Image();

carImage.onload = () => {
  const car = new PlayerCar(400, 400, carImage);

  const car2 = new PlayerCar(-400, 400, carImage);

  new PlayerCar(-400, -400, carImage);

  new PlayerCar(400, -400, carImage);
};

carImage.src = "/images/Cars/Black_Car1.png";

loop();

function resizeCanvas() {
  canvas.width = panel.getBoundingClientRect().width*.93;
  canvas.height = panel.getBoundingClientRect().height*.89;
 
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.imageSmoothingEnabled = false; //to Stop anti-aliasing
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
