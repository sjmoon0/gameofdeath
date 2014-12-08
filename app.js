var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var url = require('url');

var numClients=0;
var gameStarted=false;
var numCharChosen=0;

app.listen(8001);

function handler (req, res) {
  
  var url_request = url.parse(req.url).pathname;      
  var tmp  = url_request.lastIndexOf(".");
  var extension  = url_request.substring((tmp + 1));
  
  console.log("hey: "+url_request);

  fs.readFile(__dirname + '/index.html',
  //fs.readFile(__dirname + url_request,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    
    else{
        if (extension === 'html') res.writeHeader(200, {"Content-Type": 'text/html'});
        else if (extension === 'htm') res.writeHeader(200, {"Content-Type": 'text/html'});
        else if (extension === 'css') res.writeHeader(200, {"Content-Type": 'text/css'});
        else if (extension === 'js') res.writeHeader(200, {"Content-Type": 'application/javascript'});
        else if (extension === 'png') {
          res.writeHeader(200, {"Content-Type": 'image/png'});
          res.end(url_request,'binary');
          return;
        }
        else if (extension === 'jpg') {
          res.writeHeader(200, {"Content-Type": 'image/jpg'});
          res.end(url_request,'binary');
          return;
        }
        else if (extension === 'jpeg') res.writeHeader(200, {"Content-Type": 'image/jpeg'});
        else { res.writeHead(200);console.log("NO CORRECT EXTENSION");};
    }
    
    //console.log(extension);
    //res.writeHeader(200,{"Content-Type": "text/html"});
    res.end(data);
  });
}
console.log("~Server Running~");

io.on('connection', function (socket) {
  console.log("A Client connected");
  numClients++;

  //This sends data only one client. Sent only once upon connection
  socket.emit('load', { hello: 'world' });
  //This sends data to all connected clients
  io.emit('client_counter',numClients);

  if(numClients==4){
      gameStarted=true;
      console.log("Game started!");
      io.emit('game_started',"The Game has begun!");
      //while(true){//While the game hasn't finished
        //Start player turn
        //Accept player input (click to roll)
        //Generate roll number
        //Adjust player's position
        //Send back card content to player
        //Accept player input (click to finish turn. "OK" on the card)
      //}
    }

  socket.on('check_game_started', function (data) {
    socket.emit('last_client_loaded', gameStarted);
    if(gameStarted){
      console.log("Last Player Loaded!");
    }
  });

  socket.on('player_chosen', function(cp){
    //This is where you should assign playerID and send back to client
    //Create new player object with playerID, and chosen character, and remaining default values

    console.log(cp+" has been selected");
    numCharChosen++;
    io.emit('disable_player_choice',{'stuff':[{'chara':cp,'numChar':numCharChosen}]});
    if(numCharChosen==4){
      io.emit('start_gameplay', {'stuff':'more stuff'});
    }
  });

  socket.on('disconnect',function(){
    console.log("A client disconnected");
    numClients--;
    io.emit('client_disconnect',"We've lost another comrade!");
  });

  /*
  var movePlayer(playerID, ){
    
  }
  */
});