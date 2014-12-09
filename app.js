var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var url = require('url');

var numClients=0;
var gameStarted=false;
var numCharChosen=0;
var allClients=[];
var currentPlayer=0;

var players;
var boardUpdate;

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
        else { res.writeHead(200);};
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
  allClients.push(socket);
  //This sends data only one client. Sent only once upon connection
  var uID="Client-"+allClients.indexOf(socket);
  socket.emit('load', { user: uID });
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
    else if(numClients>4){
      numClients--;
      delete allClients[allClients.indexOf(socket)];
    }

  socket.on('check_game_started', function (data) {
    socket.emit('last_client_loaded', gameStarted);
    console.log(data);
    if(gameStarted){
      console.log("Last Player Loaded!");
    }
  });

  socket.on('player_chosen', function(cp){
    //This is where you should assign playerID and send back to client
    //Create new player object with playerID, and chosen character, and remaining default values
    for(i=0;i<4;++i){
      if(players[i].name==cp){
        players[i].socket=socket;
        console.log(cp+" player created: "+players[i]);
      }
    }
    socket.emit('set_user', cp);
    //console.log(cp+" has been selected");
    numCharChosen++;
    io.emit('disable_player_choice',{'stuff':[{'chara':cp,'numChar':numCharChosen}]});
    if(numCharChosen==4){
      io.emit('start_gameplay', boardUpdate);
    }
  });

  socket.on('disconnect',function(){
    console.log("A client disconnected");
    numClients--;
    delete allClients[allClients.indexOf(socket)];
    io.emit('client_disconnect',"We've lost another comrade!");
  });

  socket.on('ready_to_play',function(characterThatIsReadyToPlay){
    io.emit('take_turn',boardUpdate);
  });

  socket.on('roll_dice', function(characterThatRolledDice){
    var temp=generateRollResult(characterThatRolledDice)
    socket.emit('roll_result',temp);
  });

  socket.on('end_turn',function(characterThatEndedTurn){
    io.emit('take_turn',nextUpdate(characterThatEndedTurn));
  });
});

var initializePlayers=function(){
  players=[
    {"name":"Ape","location":0,"health":100,"money":5000,"disease":null, "order":0,"socketid":null},
    {"name":"Bob","location":0,"health":100,"money":5000,"disease":null, "order":1,"socketid":null},
    {"name":"Cow","location":0,"health":100,"money":5000,"disease":null, "order":2,"socketid":null},
    {"name":"Dan","location":0,"health":100,"money":5000,"disease":null, "order":3,"socketid":null}];
}

var initializeUpdate=function(){
  boardUpdate={"p1":0,"p2":0,"p3":0,"p4":0,"currPlayer":"Ape","prevPlayerBrief":null};
}

var generateRollResult=function(name){
  console.log("a");
  var r=Math.floor((Math.random() * 12) + 1);
  console.log("b");
  var st=1;
  console.log("c");
  var nl;
  console.log("d");
  for(i=0;i<4;++i){
    if(players[i].name=name){
      players[i].location=(players[i].location+r)%40;
      nl=players[i];
    }
  }
  console.log("e");
  var cc="YOU GOT SHOT. BRO...YOU OKAY?"
  console.log("f");
  return {'roll':r,'spaceType':st,'newLocation':nl,'cardContent':cc};
} 

var nextUpdate=function(endingPlayer){
  boardUpdate.p1=players[0].location;
  boardUpdate.p2=players[1].location;
  boardUpdate.p3=players[2].location;
  boardUpdate.p4=players[3].location;
  for(i=0;i<4;++i){
      if(players[i].name=endingPlayer){
        boardUpdate.currPlayer=players[(i+1)%4].name;
      }
    }
  return boardUpdate;
}

initializePlayers();
initializeUpdate();
console.log("::Players initialized::");