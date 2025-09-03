function Visualisations(){
	
	this.visuals = [];

	this.selectedVisual = null;

	this.add = function(vis){
		this.visuals.push(vis);
	
		if(this.selectedVisual == null){
			this.selectVisual(vis.name);
		}
	};
	
	this.selectVisual = function(visName){
        
        //call unselectVisual in currentVisual
        if(this.selectedVisual!=null)
        if(this.selectedVisual.hasOwnProperty("unSelectVisual")){
            this.selectedVisual.unSelectVisual();
        }
        
		for(var i = 0; i < this.visuals.length; i++){
			if(visName == this.visuals[i].name){
				this.selectedVisual = this.visuals[i];
                if(this.selectedVisual.hasOwnProperty("selectVisual")){
                    this.selectedVisual.selectVisual();
                }
			}
		}
	};
}
