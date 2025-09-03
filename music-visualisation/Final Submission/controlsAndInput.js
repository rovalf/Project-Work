function ControlsAndInput(){
	
	this.menuDisplayed = false;

	this.playbackButton = new PlaybackButton();

	// this.slidersRGB = new SlidersRGB();

	// instructions to open up the menu
	this.spacebuttontext = function(){
		fill(255);
		textSize(windowWidth/24);
		noStroke();
		text("Press Space for Visualisation Menu !", windowWidth/6, windowHeight/2.8);
	}

	// make the window fullscreen or revert to windowed
	this.mousePressed = function(){
		
		let isMouseInSpiralGui = spiralVis.checkIfMouseInSpiralGui();
		let isMouseInRidgePlotsGui = RidgePlotsVis.checkIfMouseInRidgePlotsGui();
		let isMouseInRidgePLotsSliders = RidgePlotsVis.hitCheckSliders();
		let isMouseInWavePatternSliders = wavePatternVis.hitCheckSliders();

		// except for when playbutton or sliders are clicked
		if(!this.playbackButton.hitCheck() && 
		   !isMouseInWavePatternSliders && 
		   !isMouseInRidgePLotsSliders &&
		   !isMouseInRidgePlotsGui && 
		   !isMouseInSpiralGui){

			var fs = fullscreen();
			fullscreen(!fs);
			}
		};

	// space key is used to open menu
	this.keyPressed = function(keycode){
		console.log(keycode);
		if(keycode == 32){
			this.menuDisplayed = !this.menuDisplayed;
		}

		if(keycode > 48 && keycode < 58){
			var visNumber = keycode - 49;
			vis.selectVisual(vis.visuals[visNumber].name); 
		}
	};

	this.draw = function(){

		textFont(webglFont);
		push();
		fill(255);
		noStroke();
		textSize(34);

		this.playbackButton.draw();

		//only draw the menu if menu displayed is set to true.
		if(this.menuDisplayed){

			text("Select a visualisation:", 15, 110);
			this.menu();

		}else if(!sound.isPlaying()){
			// toggles the text when the menu is being displayed
			this.spacebuttontext();
		}

		pop();
	};

	this.menu = function(){
		//draw out menu items for each visualisation
		for(var i = 0; i < vis.visuals.length; i++){
			var yLoc = 145 + i*40;
			text((i+1) + ":  " +vis.visuals[i].name, 15, yLoc);
		}
	};
}


