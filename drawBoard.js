var draw_c=function () {
  //Variables
  var c_canvas = document.getElementById("c");
  var context = c_canvas.getContext("2d");
  var outR = 275;
  var innR = 225;
  var numSpaces = 20;
  var width = c_canvas.width;
  var height = c_canvas.height;
  var xMid = (width / 2) + 150;
  var yMid = (height / 2);
  var health = 80;
  var money = 4000;
  
  //Draw Background
  context.fillStyle = "#a2a2a2";
  context.fillRect(300,0, width, height);
  
  //Draw Outline
  context.strokeStyle = "#000000";
  context.strokeRect(300,0, width, height);
  
  //Draw Circle
  context.lineWidth = 3;
  context.beginPath();
  context.arc(xMid,yMid,innR,0,2*Math.PI);
  context.fillStyle = "#8A0707";
  context.closePath();
  context.fill();
  
  context.beginPath();
  context.arc(xMid,yMid,outR,0,2*Math.PI);
  context.closePath();
  context.strokeStyle = "#000000";
  context.stroke();
  
  //var even = 0;
  //Draw Spaces
  for (var z = 0; z <= 2*Math.PI; z += Math.PI / numSpaces){
  	context.moveTo((Math.sin(z) * outR) + xMid, (Math.cos(z) * outR) + yMid);
  	context.lineTo((Math.sin(z) * innR) + xMid, (Math.cos(z) * innR) + yMid);
  }  
    
  context.stroke();
  
  //Create Array for Colored Spaces
  var spaceColor = ["red"];
  var text = "Colors: ";
  for (index = 0; index < numSpaces * 2; index++){
  	switch(index){
  	case 0:
  	case 1:
  		spaceColor[index] = "red"; //hospital spaces
  		break;
  	case 6:
  	case 25:
  		spaceColor[index] = "#CCB280"; //shop spaces
  		break;
  	case 15:
  	case 30: 
  		spaceColor[index] = "#251919"; //death cut spaces
  		break;
  	case 20:
  	case 35:
  		spaceColor[index] = "#009900"; //good fortune spaces
  		break;
  	default:
  		spaceColor[index] = "#FFFF99"; //normal spaces
  		break;
  	}
  }
  
  //Draw Multiple Colored Squares
  var temp = 0;
  for(var z = 0; z < numSpaces*2; z++){
    context.beginPath();
    context.arc(xMid,yMid,outR,(Math.PI/numSpaces) * (z-1),(Math.PI/numSpaces) * z);
    context.arc(xMid,yMid,innR,(Math.PI/numSpaces) * z,(Math.PI/numSpaces) * (z-1),true);
    context.closePath();
    context.fillStyle = spaceColor[z];
    context.fill();
  }
  
  //Draw 'Game of Death'
  var deathX = 530;
  var deathY = 300;
  
  context.font = '60pt Chiller';
  context.strokeStyle = "#000000";
  context.lineWidth = 3;
  context.strokeText('Game of Death', deathX, deathY);
  
  //!--- DRAW INVENTORY ---!\\
  //Draw Inventory Background
  context.fillStyle = "#abeeff";
  context.fillRect(0, 0, 280, height);
  
  context.strokeStyle = "#003087";
  context.strokeRect(2, 2, 280, height-3);
 
  
  
  //Draw Inventory Title
  context.font = '32pt Arial Black';
  context.fillStyle = "black";
  context.fillText("Inventory", 30, 50);
  
  //Draw "Health <3"
  var barX = 60;
  context.font = '12pt Arial';
  context.fillStyle = "#000000";
  context.fillText("Health: " + health + " / 100", barX+80, height-50);

  //!--- DRAW CLIENT SPECIFIC INVENTORY ---\\
    //Draw Health Bar
  
  
  if(health <= 100){
  	  context.fillStyle = "red";
  	  context.fillRect(barX, height-40, 200 - ((100 - health) * 2), 20);
  }
  else{
  	  context.fillStyle = "#FFA1A1";
  	  context.fillRect(barX, height-40, 200, 20);	  
  }
  
  context.beginPath();
  context.rect(barX, height-40, 200, 20);
  context.strokeStyle = "#000000";
  context.stroke();
  
  //Draw Money
  context.font = '16pt Arial';
  context.fillStyle = "green";
  context.fillText("$" + money, barX+140, height-75);
  
  //Draw Avatar & Name
  var imageObj = new Image();
  var p1 = "Afrohawk";
  var avatarX = 130;
  var avatarY = 75;
  
  imageObj.onload = function() {
        context.drawImage(imageObj, avatarX, avatarY, 125, 125);
  };
  
  imageObj.src = "thebee3.jpg";
  context.beginPath();
  context.rect(avatarX, avatarY, 125, 125);
  context.strokeStyle = "#000000";
  context.stroke();
  
  context.fillStyle = "black";
  context.font = '12pt Arial';
  context.fillText("Player 1", avatarX + 25, avatarY+155);
  context.fillText(p1, avatarX + 25, avatarY+175);  
}
