//Declaring variables that will be controlling hue
var hue1Control;
var hue2Control;
var hue3Control;

//declaring variables for gui dimentions
var guiWidth;
var guiHeight;
var gui_x;
var gui_y;

//declaring arrays for drawing of particles
var particles = [];
var particles2 = [];
var particles3 = [];

var amplitude;
var fft;

function Spiral() {
  
  this.name = "spiral";
  
  let angle1 = 0;
  let angle2 = 0;
  let angle3 = 0;
  let radius = 0.15;

  let points1 = [];
  let points2 = [];
  let points3 = [];

  let maxSize;
  
  let SpiralGui;

  this.setup = function() {

    //this gui controls the hue of the spiral
    hue1Control = 1;
    hue2Control = 1;
    hue3Control = 1;
    
    //this will only call to draw the gui only if it has not been already drawn and spiral visualisation has been selected
    if(!SpiralGui && vis.selectedVisual instanceof Spiral) {
      SpiralGui = createGui('Spiral Visualizer');
      SpiralGui.setPosition(windowWidth - 200, 0);
      
      sliderRange(1, 2, 0.2);
      SpiralGui.addGlobals('hue1Control');
      SpiralGui.addGlobals('hue2Control');
      SpiralGui.addGlobals('hue3Control');

      //giving the boundaries of the gui
      gui_x = windowWidth - 200;
      gui_y = 0;
      guiHeight = 200;
      guiWidth = 185;

    }
    
  }
  this.setup();
  
  //what happens when screen resizes
  this.reset = function() {
    angle1 = 0;
    angle2 = 0;
    angle3 = 0;
    radius = 0.15;
    points1 = [];
    points2 = [];
    points3 = [];
    updateMaxSize();

    //this will position the gui based on the window size
    if(SpiralGui){
      SpiralGui.setPosition(windowWidth - 200, 0);
    }
  };
  
  //changes how big the spiral can 
  function updateMaxSize() {
    maxSize = min(windowWidth, windowHeight) / 4;
  }

  function addAudioAnalysis() {
    amplitude = new p5.Amplitude();
    fft = new p5.FFT();
  }
  addAudioAnalysis();
  
  this.draw = function() {

    //added because WEBGL 0,0 cordinate is in the middle of the canvas but I want my drawings to start from the top left
    translate(-windowWidth/2, -windowHeight/2);

    //changing color mode to HSB to control hue
    colorMode(HSB);
    //changing mode to degrees to adjusts the angle of the spirals in degrees
    angleMode(DEGREES);

    background(0);
    
    //mapping the colours and speed of the spiral based on different energy levels
    let spectrum = fft.analyze();
    let highMidEnergy = fft.getEnergy("highMid");
    let bass = fft.getEnergy("bass");
      
    let soundLevel1 = map(highMidEnergy, 0, 255, 0, 20);
    let soundLevel2 = map(bass, 0, 255, 0, 20);
    let soundLevel3 = map(amplitude.getLevel(), 0, 1, 0, 100);

    //increament on angle will be based on the sound levels mapped
    angle1 += soundLevel1;
    angle2 += soundLevel2;
    angle3 += soundLevel3;

    //when sound is paused I want to reset the entire visualisation
    if (!sound.isPlaying()) {
      angle1 = 0;
      angle2 = 0;
      angle3 = 0;
      radius = 0.15;
      points1 = [];
      points2 = [];
      points3 = [];
    }

    //draws 3 seperate spiral of different speed and colour base on what energy levels they are mapped with
    if (sound.isPlaying()) {
      let x1 = width / 4 + (radius * angle1) * cos(angle1);
      let y1 = height / 3 + (radius * angle1) * sin(angle1);
      points1.push({ x: x1, y: y1 });

      //spiral mapped by highMidEnergy
      beginShape();
      for (let i = 0; i < points1.length; i++) {
        let point = points1[i];
        let hue1 = (soundLevel1 + i * 5 * hue1Control) % 360; 
        let saturation = map(i, 0, points1.length, 0, 255);
        let brightness = 255;

        noFill();
        strokeWeight(2);
        stroke(hue1, saturation, brightness);

        vertex(point.x, point.y);
      }
      endShape();

      //ensures that the particles are removed after a certain "age"
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].draw();
        if (particles[i].age <= 0) {
          // Remove particles that have aged out
          particles.splice(i, 1); 
        }
      }

      //only when spiral is active is when particles are generated
      if (sound.isPlaying()) {
      //the coordinates are based on where the spiral is at
      particles.push(new Particle(x1, y1, color(random(0,255)), soundLevel1, angle1));
      }

      let x2 = (3 * width) / 4 + (radius * angle2) * cos(angle2);
      let y2 = height / 3 + (radius * angle2) * sin(angle2);
      points2.push({ x: x2, y: y2 });

      //spiral mapped by base
      beginShape();
      for (let i = 0; i < points2.length; i++) {
        let point = points2[i];
        let hue2 = (soundLevel2 + i * 5 * hue2Control) % 360;
        let saturation = map(i, 0, points2.length, 0, 255);
        let brightness = 255;

        noFill();
        strokeWeight(2);
        stroke(hue2, saturation, brightness);

        vertex(point.x, point.y);
      }
      endShape();

      //same with particle1
      for (let i = particles2.length - 1; i >= 0; i--) {
        particles2[i].draw();
        if (particles2[i].age <= 0) {
          // Remove particles that have aged out
          particles2.splice(i, 1); 
        }
      }

      //only when spiral is active is when particles are generated
      if (sound.isPlaying()) {
      particles2.push(new Particle2(x2, y2, color(random(100,140),0,random(100,140)), soundLevel2, angle2));
      }

      let x3 = width / 2 + (radius * angle3) * cos(angle3);
      let y3 = (3 * height) / 4 + (radius * angle3) * sin(angle3);
      points3.push({ x: x3, y: y3 });

      //spiral mapped by amplitude level
      beginShape();
      for (let i = 0; i < points3.length; i++) {
        let point = points3[i];
        let hue3 = (soundLevel3 + i * 5 * hue3Control) % 360;
        let saturation = map(i, 0, points3.length, 0, 255);
        let brightness = 255;

        noFill();
        strokeWeight(2);
        stroke(hue3, saturation, brightness);

        vertex(point.x, point.y);
      }
      endShape();

      //ensures that the particles are removed after a certain "age"
      for (let i = particles3.length - 1; i >= 0; i--) {
          particles3[i].draw();
          if (particles3[i].age <= 0) {
            // Remove particles that have aged out
            particles3.splice(i, 1); 
          }
      }
  
      //only when spiral is active is when particles are generated
      if (sound.isPlaying()) {
        particles3.push(new Particle3(x3 - 25, y3, color(150, 150, 150, 200), soundLevel3, angle3));
      }
  

      //saves the previous points so that it can continue from where it left off when sound is played
      if (points1.length > 1) {
        for (let i = 1; i < points1.length; i++) {
          let prevPoint = points1[i - 1];
          let currPoint = points1[i];
          line(prevPoint.x, prevPoint.y, currPoint.x, currPoint.y);
        }
      }

      if (points2.length > 1) {
        for (let i = 1; i < points2.length; i++) {
          let prevPoint = points2[i - 1];
          let currPoint = points2[i];
          line(prevPoint.x, prevPoint.y, currPoint.x, currPoint.y);
        }
      }

      if (points3.length > 1) {
        for (let i = 1; i < points3.length; i++) {
          let prevPoint = points3[i - 1];
          let currPoint = points3[i];
          line(prevPoint.x, prevPoint.y, currPoint.x, currPoint.y);
        }
      }

      //call maxSize
      maxSize = min(windowWidth, windowHeight) / 4;

      //this is when maxsize is reached resets the spiral back to 0
      if (radius * angle1 >= maxSize) {
        angle1 = 0;
        points1 = [];
      }

      if (radius * angle2 >= maxSize) {
        angle2 = 0;
        points2 = [];
      }

      if (radius * angle3 >= maxSize) {
        angle3 = 0;
        points3 = [];
      }
    }

    //reset back to default
    angleMode(RADIANS);
    colorMode(RGB);

  };

  //Remove sliders when cleanup is called
  this.cleanup = function() {
    //reset particles
    particles = [];

    if(redSlider){
        redSlider.remove();
    }
    if(greenSlider){
        greenSlider.remove();
    }
    if(blueSlider){
        blueSlider.remove();
    }

    if(xSlider){
        xSlider.remove();
    }
    if(ySlider){
        ySlider.remove();
    }
    if(zSlider){
        zSlider.remove();
    }
    
  }

  //For toggling the gui
  this.unSelectVisual = function() {
    if (SpiralGui) {
      SpiralGui.hide();
    }
  }
  
  this.selectVisual = function() {
    if (SpiralGui) {
      SpiralGui.show();
    }
  }

  //this is to prevent fullscreen from happening when the gui is clicked
  this.checkIfMouseInSpiralGui = function() {
    if(vis.selectedVisual instanceof Spiral){
      if (
        mouseX > gui_x &&
        mouseX < gui_x + guiWidth &&
        mouseY > gui_y &&
        mouseY < gui_y + guiHeight
      ) {
              console.log("spiral gui clicked");
        return true;
      }
    }
  }
}

//creation of particle1
function Particle(x,y,colour,speed,angle){
  this.x = x;
  this.y = y;
  this.angle = angle;
  this.speed = speed;
  this.colour = colour;
  this.age = 255;

  //drawing ellipses that shoots out as spiral spins
  this.draw = function(){
      this.update();
      let r = red(this.colour) - (255 - this.age);
      let g = green(this.colour) - (255 - this.age);
      let b = blue(this.colour) - (255 - this.age);

      let c = color(r,g,b);
      noStroke();
      fill(c);
      this.age -= 6.5;
      ellipse(this.x,this.y,6,6);
  }

  //control speeds and direction of the particle
  this.update = function(){
      this.speed -= 0.1;
      this.y += cos(this.angle) * this.speed + noise(frameCount)*10;
      this.x += sin(this.angle) * this.speed + noise(frameCount)*10;
  }

}

//creation of particle2
function Particle2(x, y, colour, speed, angle) {
  this.x = x;
  this.y = y;
  this.angle = angle;
  this.speed = speed;
  this.colour = colour;
  this.age = 255;

  //generating star-like particles
  this.draw = function () {
    this.update();
    let r = red(this.colour) - (255 - this.age);
    let g = green(this.colour) - (255 - this.age);
    let b = blue(this.colour) - (255 - this.age);

    let c = color(r, g, b);
    noStroke();
    fill(c);
    this.age -= 6.5;

    // Draw star shape
    beginShape();
    for (let i = 0; i < 5; i++) {
      let angleA = TWO_PI * i / 5 - HALF_PI;
      let angleB = TWO_PI * (i + 0.5) / 5 - HALF_PI;
      let xA = this.x + cos(angleA) * 50;
      let yA = this.y + sin(angleA) * 50;
      let xB = this.x + cos(angleB) * 25;
      let yB = this.y + sin(angleB) * 25;
      vertex(xA, yA);
      vertex(xB, yB);
    }
    endShape(CLOSE);
  };

  //This was done differently from particle1 as I want to limit the number
  //of particles being generated per frame or it will overwhelm the visualisation
  this.update = function () {
    let updateInterval = 4; // Update every 10 frames
    let frameCounter = 0;
    frameCounter++;
    if (frameCounter >= updateInterval) {
      frameCounter = 0; // Reset the counter
      this.speed -= 0.01;
      this.y += cos(this.angle) * this.speed + noise(frameCount) / 100;
      this.x += sin(this.angle) * this.speed + noise(frameCount) / 100;
    }
  };
}

//creation of particle3
function Particle3(x, y, colour, speed, angle) {
  this.x = x;
  this.y = y;
  this.angle = angle;
  this.speed = speed;
  this.colour = colour;
  this.age = 255;

  //generating smoky trails as the spiral spins
  this.draw = function () {
    this.update();
    let r = red(this.colour) - (255 - this.age);
    let g = green(this.colour) - (255 - this.age);
    let b = blue(this.colour) - (255 - this.age);

    let c = color(r, g, b);
    noStroke();
    fill(c);
    this.age -= 6.5;

    //smoky particles
    beginShape();
    for (let i = 0; i < 5; i++) {
      let angleA = TWO_PI * i / 5 - HALF_PI;
      let angleB = TWO_PI * (i + 0.5) / 5 - HALF_PI;
      let xA = this.x + cos(angleA) * 50;
      let yA = this.y + sin(angleA) * 50;
      let xB = this.x + cos(angleB) * 25;
      let yB = this.y + sin(angleB) * 25;
      vertex(xA, yA);
      vertex(xB, yB);
    }
    endShape(CLOSE);
  };

  //same reason as particle2 I want to limit the paticles or the framerate will drop significantly
  this.update = function () {
    let updateInterval = 4; 
    let frameCounter = 0;
    frameCounter++;
    if (frameCounter >= updateInterval) {
      // Reset the counter 
      frameCounter = 0; 
      this.speed -= 0.01;
      this.y += cos(this.angle) * this.speed + noise(frameCount) / 100;
      this.x += sin(this.angle) * this.speed + noise(frameCount) / 100;
    }
  };
}
