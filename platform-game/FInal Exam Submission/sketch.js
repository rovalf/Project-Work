//character related
var gameChar_x;
var gameChar_y;
var gameChar_width;
var floorPos_y;
var isLeft;
var isRight;
var isFalling;
var isPlummeting;
var jump;
var scrollPos;
var gameChar_world_x;

//scene related
var clouds;
var tallmountains;
var shortmountains;
var trees;

//Interactables
var collectables;
var canyons;
var platforms;
var isContact;
var enemies;

//Counters
var collectable_score;
var health;
var jumpingSound;
var collectableSound;
var gameoverSound;
var wingameSound;

//sound for the game
function preload(){

    soundFormats('mp3','wav');

    jumpingSound = loadSound("assets/jumping.mp3");
    jumpingSound.setVolume(0.1);

    collectableSound = loadSound('assets/collectableSound.mp3');
    collectableSound.setVolume(0.8);

    gameoverSound = loadSound("assets/gameoverSound.mp3");
    gameoverSound.setVolume(0.05);

    fallingSound = loadSound("assets/fallingSound.mp3");
    fallingSound.setVolume(0.05);

    wingameSound = loadSound("assets/wingameSound.mp3");
    wingameSound.setVolume(0.04);

    dyingSound = loadSound("assets/dyingSound.mp3");
    dyingSound.setVolume(0.5);
}

function setup()
{
    mode = 0;
	createCanvas(1024, 576);
    floorPos_y = height * 3/4;
    restartGame();
    health = 3;
}

function draw()
{  
    //this was done to create pregame screen, only if player press enter will they proceed into the game.
    clear();
    if(mode == 0){
    background(background1,background2,background3);
    
	noStroke();
	fill(92, 64, 51);
	rect(0, floorPos_y, width, height - floorPos_y); 
    
    noStroke();
    fill(255);
    rect(0, floorPos_y, width , 5);
    
    drawTallmountains();
    drawShortmountains();
    drawTrees();
    drawShrine();
    drawCanyons();

    drawGameCharacter();
    isJump = false;
    jumpingSound.stop();
    
    // fill(77, 255, 192);
    fill(255,69,0);
    textSize(50);
    textAlign(CENTER);
    text('Welcome to my game world!', 512,120);
   
    //this is made to create flickering effect for my game
    let opacity = map(sin(frameCount * 0.07), -1, 1, 0, 255);
    fill(0,opacity);
    textSize(40);
    textAlign(CENTER);
    text('Press enter to start!',512,190);
    
    //controls for the game
    fill(0,255,255);
    textSize(25);
    text('Game Controls',512,250);
    text('Space bar/Up Arrow Key/W key = jump',512,300);
    text('A key or Left Arrow Key = left',512,350);
    text('D key or Right Arrow Key = Right',512,400);




    }
    
    //this codes are the main game codes
    if(mode==1){ 
    //drawBackground
    background(background1,background2,background3);
    
	noStroke();
	fill(92, 64, 51);
	rect(0, floorPos_y, width, height - floorPos_y); 
    
    noStroke();
    fill(255);
    rect(0, floorPos_y, width , 5);
    
    push();
    translate(scrollPos,0);

    drawClouds();
    drawTallmountains();
    drawShortmountains();
    drawTrees();
    drawShrine();
    drawCanyons();
    drawPlatforms();
    
	//collectable tokens
    //call function to check if Game Char in collectable range
    for(var i = 0; i < collectables.length; i++){
        if(collectables[i].isFound == false){
            drawCollectable(collectables[i]);

            checkIfGameCharInCollectableRange(collectables[i]);
        }
    }
    
    drawEnemies();

    renderFlagpole();
    
    pop();

    checkIfCharacterHasDied();

    countCollectables();
    
    drawGameCharacter();

    gameChar_world_x = gameChar_x - scrollPos;
    
    //call function to check if Game Char over the canyon
    checkIfGameCharisOnAnyCanyons();

    //check if player reached the flagpole
    checkIfFlagpoleIsReached();
    
    //gameChar Interactions
    gameChar_Interactions();

    }
}
//creating a function that loops the drawing of clouds
function drawClouds(){
    for(var i = 0; i < clouds.length; i++){
        var cloud = clouds[i];
        fill(252,252,150);
        ellipse(cloud.pos_x,cloud.pos_y,cloud.size);
        ellipse(cloud.pos_x - 32, cloud.pos_y, cloud.size-12);
        ellipse(cloud.pos_x + 32, cloud.pos_y, cloud.size-12);
        cloud.pos_x = cloud.pos_x + 1;
    
    }
}
//creating a function that loops the drawing of tall mountains
function drawTallmountains(){
    for(var i = 0; i < tallmountains.length; i++){
        var tallmountain = tallmountains[i];
    
        fill(96,96,96);
        beginShape(); 
        vertex(tallmountain.pos_x - 100, tallmountain.pos_y + 233);
        vertex(tallmountain.pos_x, tallmountain.pos_y);
        vertex(tallmountain.pos_x + 100, tallmountain.pos_y + 233);
        endShape();
        
        fill(255);
        beginShape();
        vertex(tallmountain.pos_x - 39, tallmountain.pos_y + 90);
        vertex(tallmountain.pos_x, tallmountain.pos_y);
        vertex(tallmountain.pos_x + 39, tallmountain.pos_y + 90);
        endShape();
        
        fill(96,96,96);
        ellipse(tallmountain.pos_x - 20, tallmountain.pos_y + 93,28,28);
        
        fill(96,96,96);
        ellipse(tallmountain.pos_x + 20, tallmountain.pos_y + 93,28,28);

    }
}
//creating a function that loops the drawing of short mountains
function drawShortmountains(){
    for(var i = 0; i < shortmountains.length; i++){
        var shortmountain = shortmountains[i];
        
    
        fill(96,96,96);
        beginShape(); 
        vertex(shortmountain.pos_x + 130, shortmountain.pos_y + 233);
        vertex(shortmountain.pos_x + 210, shortmountain.pos_y + 170);
        vertex(shortmountain.pos_x + 290, shortmountain.pos_y + 233);
        endShape();
    
        fill(255);
        beginShape(); 
        vertex(shortmountain.pos_x + 197, shortmountain.pos_y + 180);
        vertex(shortmountain.pos_x + 210, shortmountain.pos_y + 170);
        vertex(shortmountain.pos_x + 223, shortmountain.pos_y + 180);
        endShape();
    
        fill(255,255,255,60);
        rect(shortmountain.pos_x + 165 ,shortmountain.pos_y + 193, 40, 10, 10, 10, 10);
        
        fill(255,255,255,60);
        rect(shortmountain.pos_x + 210 ,shortmountain.pos_y + 203, 50, 10, 10, 10, 10);
    
    }
}
//creating a function that loops the drawing of trees
function drawTrees(){
    for(var i = 0; i < trees.length; i++){
        var tree = trees[i];
        fill(255,0,0);
        ellipse(tree.pos_x,tree.pos_y,10,10);
    
        fill(102,51,0);
        rect(tree.pos_x - 30, tree.pos_y - 28, 60 ,80);
        
        fill(0,204,0);
        beginShape();
        vertex(tree.pos_x - 45,tree.pos_y - 65);
        vertex(tree.pos_x, tree.pos_y - 130);
        vertex(tree.pos_x + 45, tree.pos_y - 65);
        endShape();
    
        fill(0,204,0);
        beginShape();
        vertex(tree.pos_x - 60,tree.pos_y - 10);
        vertex(tree.pos_x, tree.pos_y - 100);
        vertex(tree.pos_x + 60, tree.pos_y - 10);
        endShape();
    
        fill(255);
        beginShape();
        vertex(tree.pos_x - 20,tree.pos_y - 105);
        vertex(tree.pos_x , tree.pos_y - 130);
        vertex(tree.pos_x + 20, tree.pos_y - 105);
        endShape();
    }
}
//draw a shrine
function drawShrine(){
    
    //5. A shrine
    
    fill(255);
    rect(shrine.pos_x + 364, shrine.pos_y - 152, 140, 12);
    fill(29,71,80);
    rect(shrine.pos_x + 364, shrine.pos_y - 150, 140, 12);
    fill(255,69,0);
    rect(shrine.pos_x + 366, shrine.pos_y - 138, 135, 10);
    fill(255,69,0);
    rect(shrine.pos_x + 366, shrine.pos_y - 118, 135, 15);
    fill(255,69,0);
    rect(shrine.pos_x + 381, shrine.pos_y - 138, 20, 143);
    fill(255,69,0);
    rect(shrine.pos_x + 465, shrine.pos_y - 138, 20, 143);
    
}
//creating a function that loops the drawing of canyons
function drawCanyons(){
    for(var i = 0; i < canyons.length; i++){
        var canyon = canyons[i];
        fill(0);
        rect(canyon.pos_x, canyon.pos_y , canyon.width, 200);
    }
}
//creating a function that loops the drawing of collectables
function drawCollectable(collectable){
        
        fill(255,255,0);
        beginShape();
        vertex(collectable.pos_x,collectable.pos_y - 30);
        vertex(collectable.pos_x - 15,collectable.pos_y);
        vertex(collectable.pos_x - 45,collectable.pos_y);
        vertex(collectable.pos_x - 20,collectable.pos_y + 25);
        vertex(collectable.pos_x - 30,collectable.pos_y + 60);
        vertex(collectable.pos_x,collectable.pos_y + 32);
        vertex(collectable.pos_x + 30,collectable.pos_y + 60); 
        vertex(collectable.pos_x + 20,collectable.pos_y + 25);
        vertex(collectable.pos_x + 42,collectable.pos_y);
        vertex(collectable.pos_x + 15,collectable.pos_y);
        endShape();

}
//increase score when collectable has been collected
function countCollectables(){
        fill(0,0,255);
        noStroke();
        textSize(15);
        textAlign(CENTER,CENTER);
        text("score: " + collectable_score, 30, 20);
}
//creates the flagpole and animation when reached
function renderFlagpole(){
    push();
    strokeWeight(5);
    stroke(100);
    line(flagpole.pos_x, flagpole.pos_y, flagpole.pos_x, flagpole.pos_y - 250);

    if(flagpole.isCompleted == true){
        fill(255);
        noStroke();
        rect(flag.pos_x, flag.pos_y,70,55); 
        fill(220,20,60);
        noStroke();
        ellipse(flag.pos_x + 34,flag.pos_y + 27,30,30);

    if(flag.pos_y < flagpole.pos_y - 50){
        flag.pos_y += 1;
        }

    }else{
        fill(255);
        noStroke();
        rect(flag.pos_x, flag.pos_y,70,55);  
        fill(220,20,60);
        noStroke();
        ellipse(flag.pos_x + 34,flag.pos_y + 27,30,30);
    }

    pop();
}
//ensure that minimum score of 3 has been reached
function checkIfFlagpoleIsReached(){
    var display_score = {isRequired: true};
    var d = abs(gameChar_world_x - flagpole.pos_x);

    if(collectable_score < 3 && display_score.isRequired == true){
        fill(220,20,60);
        noStroke();
        textSize(14);
        textAlign(CENTER);
        text("You have not collected all the Stars!", 512, 134);
        
    }

    if(d < 15 && collectable_score < 3){
        flagpole.isCompleted = false;
        isRight = false;
    }
    
    if(collectable_score == 3 && display_score.isRequired == true){
        fill(127,255,0);
        noStroke();
        textSize(14);
        textAlign(CENTER);
        text("You have collected all the Stars!", 512, 134);
    
    if(d < 15){
        flagpole.isCompleted = true;
        fill(0);
        noStroke();
        textAlign(CENTER);
        textSize(28);
        text("Level Complete! Press Enter to restart level", 510, 110);
        isLeft = false;
        isRight = false;
        jump = false;
        if(flagpole.isCompleted == true){
            wingameSound.play();
        }
    }
    if(health >= 0 && keyCode == 13){
            restartGame();
            wingameSound.stop();
        }
    }
}
//decrease health until 0, if health < 0 gameOver
function checkIfCharacterHasDied(){

    fill(139,0,0);
    noStroke();
    textSize(15);
    textAlign(CENTER,CENTER);
    text("health: " + health, 30, 40);

    if(gameChar_y > height + 300){
        isLeft = false;
        jump = false;
        isRight = true;
        scrollPos = 0;
        health -= 1;
        
        if(health >= 0){
            restartGame();
        }else{
            health = "                   health: No More Health Left!";
            gameover();
        }
    }
}
//reset character postition after it dies, if health < 0 game over screen will be shown
function gameover(){
    var display_score = {isRequired: true};
    fill(0);
    noStroke();
    textSize(20);
    text("Game Over, Press Space to Restart Game ", 512, 164);
    display_score.isRequired = false;
    gameoverSound.play();

    if(keyCode == 32){
        health = 3;
        restartGame();
        gameoverSound.stop();
    }

}

function restartGame(){
    //Where character spawns
	gameChar_x = width/2;
	gameChar_y = floorPos_y;
    gameChar_width = 40;
    
    //setupScene
    background1= random(240,252);
    background2= random(140,152);
    background3= random(60,76);
    
    //clouds in background
    clouds = [{pos_x : random(500,700), pos_y : random(70,120), size:random(49,65)},
              {pos_x : random(0,300), pos_y : random(90,150), size:random(49,65)}];
    
    //shortmountain in background
    tallmountains = [{pos_x : 530, pos_y : 200},
                     {pos_x : 1130, pos_y : 200},
                     {pos_x : -350, pos_y : 200}];
    
    //shortmountain in background
    shortmountains = [{pos_x : 530, pos_y : 200},
                      {pos_x : 1030, pos_y : 200},
                      {pos_x : -670, pos_y : 200}];

    //trees in the background
    trees = [{pos_x : 900, pos_y : 380},
             {pos_x : 350, pos_y : 380}];
    
    shrine = {pos_x : width/13 , pos_y : floorPos_y};   
    
    //setupCollectables
    collectables = [{pos_x : random(700,740), pos_y : 250, isFound: false},
                    {pos_x : random(1010,1100), pos_y : 340, isFound: false},
                    {pos_x : -85, pos_y: 100, isFound: false}];
    
    //setupCanyons
    canyons = [{pos_x : random(150,160), pos_y : 433, width : random(85,100)},
               {pos_x : random(610,640), pos_y : 433, width : random(85,100)},
               {pos_x : random(1100,1150), pos_y : 433, width : random(85,100)}];

    platforms = [];
    for(var i = 0; i < 5; i++){
        if(i == 3){

            platforms.push(createPlatforms(-20 * i, floorPos_y - 185,140));
            
        }else{

            platforms.push(createPlatforms(305 * i,floorPos_y - 85,140));

        }
    }

    enemies = [];
    for(var i = 0; i < 3; i++){
        if(i == 1){

            enemies.push(new Enemy(1000 * i,floorPos_y - 20,100));

        }else if(i == 2){
        
            enemies.push(new Enemy(100 * i,floorPos_y - 10,100));

        }else{

            enemies.push(new Enemy(100 * i,floorPos_y - 100,100));

        }
    }
       
    
    //gameChar codes
    isLeft = false;
    isRight = false;
    isFalling = false;
    isPlummeting = false;
    jump = false;
    
    //scrolling
    gameChar_world_x = gameChar_x;
    scrollPos = 0;

    //collectable score
    collectable_score = 0;

    //end game flag pole
    flagpole = {isCompleted: false, pos_x: 1400, pos_y: floorPos_y};
    flag = {pos_x: 1400, pos_y: flagpole.pos_y - 250};

}

function gameChar_Interactions(){
    //moving left
    if(isLeft == true){
        scrollPos += 5;
    }
    //moving right
    if(isRight == true){
        scrollPos -= 5;
    }
     //jumping 
     if(jump == true){
        gameChar_y -= 110;
    }
    //Whether gameChar is jumping or not
    if(gameChar_y < floorPos_y){
        jump = false;

        isContact = false;
    //checking if character on platform
        for(var i = 0; i < platforms.length; i++){
            if(platforms[i].checkContact(gameChar_world_x,gameChar_y) == true){
                isContact = true;
                isFalling = false;
                break;
            }
        }
    //if character not on platform then character will fall as per normal
        if(isContact == false){
            gameChar_y += 3.5;
            isFalling = true;
        }
    //else character stays on platform
    }else{
        isFalling = false;
    }
    
    //preventing double jump
    if(isPlummeting){
        gameChar_y += 10;
        
        isLeft = false;
        isRight = false;
        jump = false;
        return;
    }

    if(gameChar_world_x < -350){
        isLeft = false;
    }

}
//character drawing codes
function drawGameCharacter(){
    if(isLeft && isFalling)
        {
            noStroke();
            fill(64,64,64);
            ellipse(gameChar_x,gameChar_y - 48,30,20)
            fill(255, 255, 0);
            //headband
            noStroke();
            fill(0);
            rect(gameChar_x - 15 ,gameChar_y - 52,30,5,5,5,5,5);
            //body
            noStroke();
            rect(gameChar_x - 10,gameChar_y - 38,20,25);
            //legs
            stroke(0);
            fill(64,64,64);
            rect(gameChar_x - 10,gameChar_y - 22,10,18);
            rect(gameChar_x,gameChar_y - 22,10,18);
            //arms
            fill(64,64,64);
            rect(gameChar_x + 8,gameChar_y - 50,5,19);
            rect(gameChar_x - 15,gameChar_y - 50,5,19);
            //shoe
            noStroke();
            fill(255,0,0);
            ellipse(gameChar_x-5,gameChar_y-2,10,5);
            ellipse(gameChar_x+5,gameChar_y-2,10,5);
    
        }
    else if(isRight && isFalling)
        {
            // add your jumping-right code
            
            noStroke();
            fill(64,64,64);
            ellipse(gameChar_x,gameChar_y - 48,30,20)
            fill(255, 255, 0);
            //headband
            noStroke();
            fill(0);
            rect(gameChar_x - 15 ,gameChar_y - 52,30,5,5,5,5,5);
            //body
            noStroke();
            rect(gameChar_x - 10,gameChar_y - 38,20,25);
            //legs
            stroke(0);
            fill(64,64,64);
            rect(gameChar_x - 10,gameChar_y - 22,10,18);
            rect(gameChar_x,gameChar_y - 22,10,18);
            //arms
            fill(64,64,64);
            rect(gameChar_x + 10,gameChar_y - 50,5,19);
            rect(gameChar_x - 13,gameChar_y - 50,5,19);
            //shoe
            noStroke();
            fill(255,0,0);
            ellipse(gameChar_x-5,gameChar_y-2,10,5);
            ellipse(gameChar_x+5,gameChar_y-2,10,5);
    
        }
    else if(isLeft)
        {
            // add your walking left code
            //head
            noStroke();
            fill(64,64,64);
            ellipse(gameChar_x - 3,gameChar_y - 48,28,20)
            fill(255, 255, 0);
            //headband
            noStroke();
            fill(0);
            rect(gameChar_x - 17 ,gameChar_y - 52,27,5,5,5,5,5);
            //body
            noStroke();
            rect(gameChar_x - 10,gameChar_y - 38,20,25);
            //legs
            stroke(0);
            fill(64,64,64);
            triangle(gameChar_x - 9.5,gameChar_y - 14,gameChar_x,gameChar_y,gameChar_x + 9.5,gameChar_y - 14);
            fill(255,0,0);
            noStroke();
            triangle(gameChar_x - 3,gameChar_y - 3.5,gameChar_x,gameChar_y,gameChar_x + 3,gameChar_y - 3.5);
            //arms
            fill(64,64,64);
            rect(gameChar_x + 10,gameChar_y - 35,5,5);
            rect(gameChar_x,gameChar_y - 32,17,5);
            
        }
    else if(isRight)
        {
            // add your walking right code
            
            // add your walking left code
            //head
            noStroke();
            fill(64,64,64);
            ellipse(gameChar_x + 3,gameChar_y - 48,28,20)
            fill(255, 255, 0);
            //headband
            noStroke();
            fill(0);
            rect(gameChar_x - 11 ,gameChar_y - 52,27,5,5,5,5,5);
            //body
            noStroke();
            rect(gameChar_x - 10,gameChar_y - 38,20,25);
            //legs
            stroke(0);
            fill(64,64,64);
            triangle(gameChar_x - 9.5,gameChar_y - 14,gameChar_x,gameChar_y,gameChar_x + 9.5,gameChar_y - 14);
            fill(255,0,0);
            noStroke();
            triangle(gameChar_x - 3,gameChar_y - 3.5,gameChar_x,gameChar_y,gameChar_x + 3,gameChar_y - 3.5);
            //arms
            fill(64,64,64);
            rect(gameChar_x - 12,gameChar_y - 35,5,5);
            rect(gameChar_x - 15,gameChar_y - 32,17,5);
    
        }
    else if(isFalling || isPlummeting)
        {
            // add your jumping facing forwards code
        
            noStroke();
            fill(64,64,64);
            ellipse(gameChar_x,gameChar_y - 48,30,20)
            fill(255, 255, 0);
            //headband
            noStroke();
            fill(0);
            rect(gameChar_x - 15 ,gameChar_y - 52,30,5,5,5,5,5);
            //body
            noStroke();
            rect(gameChar_x - 10,gameChar_y - 38,20,25);
            //legs
            stroke(0);
            fill(64,64,64);
            rect(gameChar_x - 10,gameChar_y - 22,10,18);
            rect(gameChar_x,gameChar_y - 22,10,18);
            //arms
            fill(64,64,64);
            rect(gameChar_x + 10,gameChar_y - 50,5,19);
            rect(gameChar_x - 15,gameChar_y - 50,5,19);
            //shoe
            noStroke();
            fill(255,0,0);
            ellipse(gameChar_x-5,gameChar_y-2,10,5);
            ellipse(gameChar_x+5,gameChar_y-2,10,5);
    
    
        }
    else
        {
            // add your standing front facing code
            //head
            noStroke();
            fill(64,64,64);
            ellipse(gameChar_x,gameChar_y - 48,30,20)
            fill(255, 255, 0);
            //headband
            noStroke();
            fill(0);
            rect(gameChar_x - 15 ,gameChar_y - 52,30,5,5,5,5,5);
            //body
            noStroke();
            rect(gameChar_x - 10,gameChar_y - 38,20,25);
            //legs
            stroke(0);
            fill(64,64,64);
            rect(gameChar_x - 10,gameChar_y - 22,10,18);
            rect(gameChar_x,gameChar_y - 22,10,18);
            //arms
            fill(64,64,64);
            rect(gameChar_x + 10,gameChar_y - 38,5,19);
            rect(gameChar_x - 15,gameChar_y - 38,5,19);
            //shoe
            noStroke();
            fill(255,0,0);
            ellipse(gameChar_x-5,gameChar_y-2,10,5);
            ellipse(gameChar_x+5,gameChar_y-2,10,5);
            } 
    
}
//check if character is on any canyon
function checkIfGameCharisOnAnyCanyons(){
    for(i in canyons){
        var canyon = canyons[i];
        checkIfGameCharisOnCanyon(canyon);
    }
}

function checkIfGameCharisOnCanyon(canyon){
    
    var cond1 = gameChar_y >= floorPos_y;
    var cond2 = gameChar_world_x - gameChar_width/2>(canyon.pos_x);
    var cond3 = gameChar_world_x + gameChar_width/2<(canyon.pos_x + canyon.width);
    
    if(cond1 && cond2 && cond3){
        isPlummeting=true;
        isLeft=false;
        isRight=false;
    }

    if(isPlummeting == true && gameChar_y == floorPos_y + 10){
        fallingSound.play();
    }
}
//if collectable in range character collects it and collectable dissapears
function checkIfGameCharInCollectableRange(collectable){
    var d = dist(gameChar_world_x,gameChar_y,collectable.pos_x,collectable.pos_y + 30);
    if(d < 70){
        collectable.isFound = true;
        collectable_score += 1;
        collectableSound.play();
    }
} 
//function to loop the drawing of platforms
function drawPlatforms(){
    for(var i = 0; i < platforms.length; i++){
        platforms[i].draw();
    }
}
//creating platforms
function createPlatforms(x, y, length){
    var p = {
        x: x,
        y: y,
        length: length,

        draw: function(){
            fill(255);
            rect(this.x, this.y - 4, this.length, 4);
            fill(92, 64, 51);
            rect(this.x, this.y, this.length, 20);
        },
        checkContact: function(gc_x, gc_y){
            if(gc_x > this.x && gc_x < (this.x + this.length)){
                var d = this.y - gc_y;
                if(d >= 0 && d < 5){
                    return true;
                }
            }
            return false;
        }
    }
    return p;
}
//draw enemies
function drawEnemies(){
     for(var i = 0; i < enemies.length; i++){
        enemies[i].draw();

        var isContact =
        enemies[i].checkContact(gameChar_world_x,gameChar_y);

        if(isContact){
            if(health > 0){
                restartGame();
                break;
            }
        }

    }
}
//if character in contact with enemy health - 1 and character dies
function Enemy(x,y,range){
    this.x = x;
    this.y = y;
    this.range = range;

    this.currentX = x;
    this.inc = 1;
    
    this.update = function(){
        this.currentX += this.inc;

        if(this.currentX >= this.x + this.range + 3){
            this.inc = -1;
        }
        
        else if(this.currentX < this.x){
            this.inc = 1;
            }
        }
        this.draw = function(){
            this.update();
            // Handle
            fill(92, 30, 0);
            rect(this.currentX, this.y - 10, 30, 8);
            
            // Blade
            fill(192,192,192);
            triangle(this.currentX, this.y, this.currentX - 15, this.y - 10, this.currentX, this.y - 10);
        }

        this.checkContact = function(gc_x,gc_y){
            var d = dist(gc_x,gc_y, this.currentX,this.y)

            if(d < 30){

                dyingSound.play();
                return true;
            }
            
            return false;
        }

}
//player input
function keyPressed(){
    
    console.log("keyPressed: " + key);
    console.log("keyPressed: " + keyCode);
    
    if (keyCode == 37 || key =='A'){
        console.log("left arrow");
        isLeft = true;
    }
    else if (keyCode == 39 || key =='D'){
        console.log("right arrow");
        isRight = true;
    }
    else if(keyCode == 13){
            mode = 1;
    }
    else if(keyCode == 38 || key =='W' || keyCode == 32){
        if(gameChar_y >= floorPos_y || isContact){
            if(!isPlummeting){
                console.log("up arrow");
                jump = true;
    
                if(jump == true){
                     jumpingSound.play();
                }
            }   
        }
    }
}
//player input    
function keyReleased(){

    console.log("keyReleased: " + key);
    console.log("keyReleased: " + keyCode);
    
    if (keyCode == 37 || key =='A'){
        console.log("left arrow");
        isLeft = false;
    }
    else if (keyCode == 39 || key =='D'){
        console.log("right arrow");
        isRight = false;
    }
}
    

    
   
    


    
    
    
    
    
    
    
    
    
    
    
    