var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

var numClients=0;
var gameStarted=false;
var numCharChosen=0;

app.listen(8001);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
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
    console.log("Last Player Loaded!");
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