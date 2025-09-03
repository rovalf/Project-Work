//displays and handles clicks on the playback button.
function PlaybackButton(){
	
	this.x = 20;
	this.y = 20;
	this.width = 20;
	this.height = 20;

	// this is called when play button is not clicked
	this.playbuttontext = function(){
		textFont(webglFont);
		fill(255);
		textSize(windowWidth/32);
		noStroke();
		text("Click on the play button to play the music!", width/4.5, height/2.4);
	}

	this.playing = false;

	this.draw = function(){

		if(this.playing){

			fill(0,255,0);
			rect(this.x, this.y, this.width/2 - 2, this.height);
			rect(this.x + (this.width/2 + 2), this.y, this.width/2 - 2, this.height);
			// to fix a bug where the colour of menu changes to green when sound is playing
			fill(255);

		}else{	

			fill(255,0,0);
			triangle(this.x, this.y, this.x + this.width, this.y + this.height/2, this.x, this.y + this.height);
			
			// toggles off when sound is not playing
			this.playbuttontext();

		}
	};

	// checks for clicks on the button, starts or pauses playabck.
	// returns true if clicked false otherwise.
	this.hitCheck = function(){
		if(mouseX > this.x && mouseX < this.x + this.width && mouseY > this.y && mouseY < this.y + this.height){
			if (sound.isPlaying()) {
    			sound.pause();
  			} else {
    			sound.loop();
  			}
  			this.playing = !this.playing;
  			return true;
		}
			return false;
	};

}