var controls = null;
var vis = null;
var sound = null;
var fourierWavepattern;
var fourierRidgePlots;
var RidgePlotsVis;
var spiralVis;
var wavePatternVis;

function preload(){
	
	sound = loadSound('assets/stomper_reggae_bit.mp3');

	webglFont = loadFont('assets/Roboto/Roboto-Black.ttf');
}

function setup(){

	canvas = createCanvas(windowWidth, windowHeight, WEBGL);

	background(0);

	controls = new ControlsAndInput();
	
	fourierWavepattern = new p5.FFT();
	fourierRidgePlots = new p5.FFT();
	
	vis = new Visualisations();

	spiralVis = new Spiral();
  	RidgePlotsVis = new RidgePlots();
	wavePatternVis = new WavePattern();
	
	vis.add(spiralVis);
	vis.add(RidgePlotsVis);
	vis.add(wavePatternVis);
	
}

function draw(){
	
	background(0);

	vis.selectedVisual.draw();

	controls.draw();
}

function mouseClicked(){
	controls.mousePressed();
}

function keyPressed() {
	
	controls.keyPressed(keyCode);
	
	// this is done so that sliders only appear on wave pattern
	if (key === '1') {
		vis.selectedVisual.cleanup();
		vis.selectedVisual = new Spiral();
		
	}else if(key === '2'){
		vis.selectedVisual.cleanup();
		vis.selectedVisual = new RidgePlots();
		createSliders();
		
	}else if (key === '3') {
		vis.selectedVisual.cleanup();
		vis.selectedVisual = new WavePattern();
		slidersRGB();
	}
}

function windowResized() {
	// the rest of the function will resize accordingly
	resizeCanvas(windowWidth, windowHeight);
	if (vis.selectedVisual.hasOwnProperty('onResize')) {
		vis.selectedVisual.onResize();
	}

	// the spiral should reset when window is resized
	if (vis.selectedVisual instanceof Spiral) {
		vis.selectedVisual.reset();
	  }
}
