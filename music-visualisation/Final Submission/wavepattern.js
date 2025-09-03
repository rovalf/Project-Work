var redSlider, greenSlider, blueSlider;

function WavePattern(){
	
	this.name = "wavepattern";

	this.draw = function() {
		
		//added because WEBGL 0,0 cordinate is in the middle of the canvas but I want my drawings to start from the top left
		translate(-windowWidth/2, -windowHeight/2);

		// to ensure sliders are only draw once
		if (!redSlider || !greenSlider || !blueSlider) {
			slidersRGB();
		}

		// assigning values to give stroke its RGB
		let redValue = redSlider.value();
		let greenValue = greenSlider.value();
		let blueValue = blueSlider.value();
		
		textFont(webglFont);
		
		// text display for each colour that the slider controls
		fill(255,0,0);
		noStroke();
		textSize(14);
		text("Decrease Red", 250, 32);
		
		fill(0,255,0);
		noStroke();
		textSize(14);
		text("Decrease Green", 250, 52);
		
		fill(0,0,255);
		noStroke();
		textSize(14);
		text("Decrease Blue", 250, 72);

		push();
		// stroke colour will now follow the values which is controlled by a slider
		strokeWeight(2);
		stroke(redValue, greenValue, blueValue);
		fill(0);
		
		// forming the waveform itself
		beginShape();
        let waveform = fourierWavepattern.waveform();
        for (let i = 0; i < waveform.length; i++) {
			let x = map(i, 0, waveform.length, 0, width);
            let y = map(waveform[i], -1, 1, 0, height);
			
			//changing the position of the wave base on mouseY coordinates
            let exclusionRangeBottom = 120;
			
			// Check if mouseY is within a certain range
			if (mouseY < exclusionRangeBottom) {
				// To keep the y-coordinate unchanged within the exclusion range
				y = map(waveform[i], -1, 1, 0, windowHeight - 500);
			} else {
				// Adjust the y-coordinate based on mouseY
				y += mouseY - windowHeight / 2;
			}
			vertex(x, y);
		}
		endShape(CLOSE);
		pop();

	}
	
	//For removal of slider from other visualisation
	this.cleanup = function() {
		
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
	
	//Prevents full screen when clicking on the sliders
	this.hitCheckSliders = function() {

		this.x = 100;
		this.y1 = 18;
		this.y2 = 38;
		this.y3 = 58;

		if(vis.selectedVisual instanceof WavePattern){
		if (
			mouseX > this.x &&
			mouseX < this.x + redSlider.width &&
			mouseY > this.y1 &&
			mouseY < this.y1 + redSlider.height
		) {
            console.log("Red Slider clicked");
			return true;
		}
		if (
			mouseX > this.x &&
			mouseX < this.x + greenSlider.width &&
			mouseY > this.y2 &&
			mouseY < this.y2 + greenSlider.height
		) {
            console.log("Green Slider clicked");
			return true;
		}
		if (
			mouseX > this.x &&
			mouseX < this.x + blueSlider.width &&
			mouseY > this.y3 &&
			mouseY < this.y3 + blueSlider.height
		) {
            console.log("Blue Slider clicked");
			return true;
		}
		return false;
		};
	}

	//hiding the gui when it is not wanted
    this.remove = function() {
        redSlider.remove();
        greenSlider.remove();
        blueSlider.remove();
    }
}

//Creates sliders that controls RGB
function slidersRGB() {
	this.x = 100;
	this.y1 = 18;
    this.y2 = 38;
    this.y3 = 58;
	// Create the sliders
    // value starts from 0 and ranges from 0 to 255
	redSlider = createSlider(0, 255, 255);
	greenSlider = createSlider(0, 255, 255);
	blueSlider = createSlider(0, 255, 255);

	// Set the position of the sliders
	redSlider.position(this.x, this.y1);
	greenSlider.position(this.x, this.y2);
	blueSlider.position(this.x, this.y3);

}
