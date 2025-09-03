var speed;
var hueOffset;

var guiWidth;
var guiHeight;
var gui_x;
var gui_y;
var RidgePlotsGui;

var xSlider, ySlider, zSlider;

function RidgePlots() {
  
  this.name = "ridgeplots";
  
  let output = [];
  let endY;
  
  //setting up the gui for ridgeplots
  this.setup = function(){
    
    //this gui controls speed and hueOffset
    speed = 0.3;
    hueOffset = 0;
    
    //this will only call to draw the gui only if it has not been already drawn and spiral visualisation has been selected
    if(!RidgePlotsGui && vis.selectedVisual instanceof RidgePlots){
      RidgePlotsGui = createGui('RidgePlot Visualizer');
      RidgePlotsGui.setPosition(windowWidth - 200, 0);
      
      sliderRange(0.3,1,0.1);
      RidgePlotsGui.addGlobals('speed');
      
      sliderRange(1,100,10);
      RidgePlotsGui.addGlobals('hueOffset');
      
      //giving the boundaries of the gui
      gui_x = windowWidth - 200;
      gui_y = 0;
      guiHeight = 133;
      guiWidth = 200;
    }
  }
  this.setup();
  
  this.draw = function () {
    
    //added because WEBGL 0,0 cordinate is in the middle of the canvas but I want my drawings to start from the top left
    translate(-windowWidth/2, -windowHeight/2);
    
    background(0);
    
    //only create the slider once
    if(!xSlider || !ySlider || !zSlider){
      console.log("creating sliders");
      createSliders();
    }
    
    textFont(webglFont);
		
		// text display for rotating x,y,z that the slider controls
		fill(255,0,0);
		noStroke();
		textSize(14);
		text("Rotate X", 250, 32);
		
		fill(0,255,0);
		noStroke();
		textSize(14);
		text("Rotate Y", 250, 52);
		
		fill(0,0,255);
		noStroke();
		textSize(14);
		text("Rotate Z", 250, 72);
    
    let xRotation = xSlider.value();
    let yRotation = ySlider.value();
    let zRotation = zSlider.value();
    
    push();
    rotateX(radians(xRotation));
    rotateY(radians(yRotation));
    rotateZ(radians(zRotation));
    
    stroke(255);
    strokeWeight(2);
    
    if(frameCount % 10 == 0){
      addWave();
    }
    
    //creating the wave and change its hue
    for(let i = output.length - 1; i >= 0; i--){
      let wave = output[i];
      
      colorMode(HSB, 360);
      //wave that is responsive to the sound level which causes the colour is to be also responsive to the sound.
      var hue = map(wave[0].y, endY, startY, 0, 360) + hueOffset;
      fill(hue % 360, 360, 360);
    
      beginShape();
      for(let j = 0; j < wave.length; j++){
        wave[j].y -= speed;
        vertex(wave[j].x, wave[j].y, wave[j].z);
      }
      endShape();

      if(wave[0].y < endY){
        output.splice(i, 1);
      }
    }   
      pop();
      colorMode(RGB);
  }

  //function to draw the wave using waveform of sound
  //This is with the addition of X as now the wave is in 3D instead of 2D
  function addWave() {
    let w = fourierRidgePlots.waveform();
    let outputWave = [];
    let heightScale = 3;
    let depthScale = 100; 
  
    for (i = 0; i < w.length; i++) {
      if (i % 20 == 0) {
        let y = map(w[i], -1, 1, -heightScale, heightScale); 
        // Height parameter
        let z = map(w[i], -1, 1, -depthScale, depthScale); 
        // Depth parameter
        let x = map(i, 0, 1024, startX, startX + spectrumWidth);
        
        outputWave.push({
          x: x,
          y: startY + y,
          z: z
        });
      }
    }
    output.push(outputWave);
  }

  // check for when the mouse is clicking the sliders
  this.hitCheckSliders = function() {

      this.x = 100;
      this.y1 = 18;
      this.y2 = 38;
      this.y3 = 58;

        if(vis.selectedVisual instanceof RidgePlots){
        if (
          mouseX > this.x &&
          mouseX < this.x + xSlider.width &&
          mouseY > this.y1 &&
          mouseY < this.y1 + xSlider.height
        ) {
                console.log("x Slider clicked");
          return true;
        }
        if (
          mouseX > this.x &&
          mouseX < this.x + ySlider.width &&
          mouseY > this.y2 &&
          mouseY < this.y2 + ySlider.height
        ) {
                console.log("y Slider clicked");
          return true;
        }
        if (
          mouseX > this.x &&
          mouseX < this.x + zSlider.width &&
          mouseY > this.y3 &&
          mouseY < this.y3 + zSlider.height
        ) {
                console.log("z Slider clicked");
          return true;
        }
        return false;
        };
  }
    
  //hiding the gui when it is not wanted
  this.remove = function() {
      xSlider.remove();
      ySlider.remove();
      zSlider.remove();
  }

  //this will set the ridgeplot when screen is resized
  this.onResize = function (){
    startX = width / 5;
    startY = height - endY;
    endY = height / 5;
    spectrumWidth = (width / 5) * 3;
    if(RidgePlotsGui){
    RidgePlotsGui.setPosition(windowWidth - 200, 0);
    }
    textDisplay = false;
  }
  this.onResize();

  // Remove sliders when cleanup is called
  this.cleanup = function() {
      if(redSlider){
        redSlider.remove();
      }
      if(greenSlider){
        greenSlider.remove();
      }
      if(blueSlider){
        blueSlider.remove();
      }
  }

  //this is to toggle the gui on and off
  this.unSelectVisual = function(){
    console.log("de select");
    if(RidgePlotsGui){
      RidgePlotsGui.hide();
    }
  }
  this.selectVisual = function(){
    console.log("select");
    if(RidgePlotsGui){
      RidgePlotsGui.show();
    }
  }

  //this is to prevent fullscreen from happening when the gui is clicked
  this.checkIfMouseInRidgePlotsGui = function() {
      if(vis.selectedVisual instanceof RidgePlots){
        if (
          mouseX > gui_x &&
          mouseX < gui_x + guiWidth &&
          mouseY > gui_y &&
          mouseY < gui_y + guiHeight
        ) {
          return true;
        }
      }
  }
}

function createSliders(){

  this.x = 100;
	this.y1 = 18;
  this.y2 = 38;
  this.y3 = 58;
  
  xSlider = createSlider(0, 360, 55);
  ySlider = createSlider(0, 360, 0);
  zSlider = createSlider(0, 360, 0);

  // Set the position of the sliders
  xSlider.position(this.x, this.y1);
  ySlider.position(this.x, this.y2);
  zSlider.position(this.x, this.y3);
};