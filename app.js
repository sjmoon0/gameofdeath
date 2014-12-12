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
var regCards,gfCards,lcCards;
var rResult;

app.listen(8001);

function handler (req, res) {
  
  var url_request = url.parse(req.url).pathname;      
  var tmp  = url_request.lastIndexOf(".");
  var extension  = url_request.substring((tmp + 1));
  
  
  //console.log("hey: "+url_request);

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
    socket.emit('take_turn',boardUpdate);
  });

  socket.on('roll_dice', function(characterThatRolledDice){
    generateRollResult(characterThatRolledDice);
    console.log('***Dice were rolled->roll:'+rResult.roll+'. spaceType:'+rResult.spaceType+'. newLocation:'+rResult.newLocation+'. cardContent:'+rResult.cardContent);
    socket.emit('roll_result',rResult);
  });

  socket.on('end_turn',function(characterThatEndedTurn){
    nextUpdate(characterThatEndedTurn);
    console.log(characterThatEndedTurn+'`s turn ended. p1:'+boardUpdate.p1+'. p2:'+boardUpdate.p2+'. p3:'+boardUpdate.p3+'. p4:'+boardUpdate.p4+' currPlayer:'+boardUpdate.currPlayer+'. prevPlayerBrief:'+boardUpdate.prevPlayerBrief);
    io.emit('take_turn',boardUpdate);
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

var initializeGenCards=function(){
  genCards=[
    {'used':false,'type':1,'health':-50,'money':0,'disease':null,'diseaseRate':0,'description':'You have been stabbed on the NYC subway. Your health is cut by 50 points.','brief':'got stabbed in a NYC subway.'},
    {'used':false,'type':1,'health':-50,'money':0,'disease':null,'diseaseRate':0,'description':'You have been attacked on the Washington D.C. subway.  Your health is cut by 50 points','brief':'got attacked in Washington D.C.'},
    {'used':false,'type':1,'health':-90,'money':0,'disease':null,'diseaseRate':0,'description':'A car hit you and your health is cut by 90 points.','brief':'got hit by a car'},
    {'used':false,'type':1,'health':-95,'money':0,'disease':null,'diseaseRate':0,'description':'A lightning struck you and your health is cut by 95 points.','brief':'got struck by lightning!'},
    {'used':false,'type':1,'health':-99,'money':0,'disease':null,'diseaseRate':0,'description':'Your parachute didn`t open while you were attempting a skydrive.  Your health point is cut by 99 points.','brief':'fell out of an airplane!'},
    {'used':false,'type':1,'health':-99,'money':0,'disease':null,'diseaseRate':0,'description':'Your plane was shot down while it was flying across the Ukraine-Russia border.  Your health is cut by 99 points.','brief':'was in a plane crash'},
    {'used':false,'type':1,'health':-10,'money':0,'disease':null,'diseaseRate':0,'description':'You are on a hunger strike to boycott the cutting of a black man by a NYC police officer.  Your health is cut by 10 points.','brief':'went on a hunger strike'},
    {'used':false,'type':1,'health':-25,'money':0,'disease':null,'diseaseRate':0,'description':'A police hit you in the head while you were having a peaceful demonstration on the street of NY. Your health is cut by 25 points.','brief':'was a victim of police brutality'},
    {'used':false,'type':1,'health':-10,'money':0,'disease':null,'diseaseRate':0,'description':'You are lying in a shopping mall to boycott the cutting of a black man by a NYC police officer, but someone stepped on your left hand and it really hurts. Your health is cut by 10 points.','brief':'`s hand was stepped on. The poor thing.'},
    {'used':false,'type':1,'health':-99,'money':0,'disease':null,'diseaseRate':0,'description':'Your home is located next to a nuclear plant, which exploded one minute ago.  Your health is cut by 99 points.','brief':'was in a nuclear explosion'},
    {'used':false,'type':1,'health':0,'money':-250,'disease':null,'diseaseRate':0,'description':'You got a speeding ticket for $250','brief':'got a speeding ticket. Ha Ha'},
    {'used':false,'type':1,'health':0,'money':-600,'disease':null,'diseaseRate':0,'description':'You have bought the latest iPhone for $600.','brief':'bought an overpriced cell phone.'},
    {'used':false,'type':1,'health':0,'money':-600,'disease':null,'diseaseRate':0,'description':'You have bought the latest iPad for $600.','brief':'bought an expensive toy'},
    {'used':false,'type':1,'health':0,'money':-200,'disease':null,'diseaseRate':0,'description':'You have bought a gun for $200.','brief':'is now packin` heat'},
    {'used':false,'type':1,'health':0,'money':-15,'disease':null,'diseaseRate':0,'description':'You have bought a hammer for $15.','brief':'purchased a very nice hammer and is very pleased.'},
    {'used':false,'type':1,'health':0,'money':-200,'disease':null,'diseaseRate':0,'description':'You have donated $200 to the Red Cross.','brief':'donated some money to a good cause'},
    {'used':false,'type':1,'health':0,'money':-100,'disease':null,'diseaseRate':0,'description':'You have donated $100 worth of toys to the Toys for Tots.','brief':'donated some toys and made some kids happy'},
    {'used':false,'type':1,'health':0,'money':-100,'disease':null,'diseaseRate':0,'description':'You have donated $100 worth of goods to the Good Will.','brief':'dropped off some stuff at the thrift shop.'},
    {'used':false,'type':1,'health':0,'money':-2500,'disease':null,'diseaseRate':0,'description':'You have donated $2500 to your university.','brief':'donated some money to the local University'},
    {'used':false,'type':1,'health':0,'money':-250000,'disease':null,'diseaseRate':0,'description':'To impress your mate, you have bought a Ferrari for $250,000','brief':'bought a swaggin` new ride!'},
    {'used':false,'type':1,'health':0,'money':-250,'disease':null,'diseaseRate':0,'description':'To make your mom happy, you bought her a KitchenAid for $200 on Mother`s Day.','brief':'bought a Mother`s day present'},
    {'used':false,'type':1,'health':0,'money':-15,'disease':null,'diseaseRate':0,'description':'To make your dad happy, you bought him a tie for $15 on Father`s Day.','brief':'bought a Father`s day present'},
    {'used':false,'type':1,'health':0,'money':-100,'disease':null,'diseaseRate':0,'description':'You bought a dozen roses for your mate on Valentine`s Day for $100.','brief':'bought a Valentine`s present. D`awww'},
    {'used':false,'type':1,'health':0,'money':-1000000,'disease':null,'diseaseRate':0,'description':'You have spent $1 million on TV ads for your election campaign.','brief':'is running for public office and spent a lot of money on it.'},
    {'used':false,'type':1,'health':0,'money':-2500000,'disease':null,'diseaseRate':0,'description':'You have spent $2.5 million on an TV ad during the superbowl.','brief':'bought a super bowl advertisement'},
    {'used':false,'type':1,'health':0,'money':5000,'disease':null,'diseaseRate':0,'description':'Your employer gave you a bonus of $5000 for a job well-done.','brief':'got a bonus.'},
    {'used':false,'type':1,'health':0,'money':300000,'disease':null,'diseaseRate':0,'description':'You have sold a potato that looks like Jay Leno on eBay for $300,000.','brief':'sold a potato that looks like Jay Leno on eBay. Nice.'},
    {'used':false,'type':1,'health':0,'money':1000000,'disease':null,'diseaseRate':0,'description':'You have sold a piece of potato chip with the image of Jesus Christ for $1,000,000 on eBay.','brief':'sold a potato chip that had an image of Jesus on it on eBay'},
    {'used':false,'type':1,'health':0,'money':150000,'disease':null,'diseaseRate':0,'description':'You decided that you don`t really need a Ferrari, so you sold it on eBay for $150,000.','brief':'sold a shiny new Ferrari'},
    {'used':false,'type':1,'health':0,'money':2500000,'disease':null,'diseaseRate':0,'description':'You have sold the sensitive information that you have stolen from Iran to the CIA for $2.5 million.','brief':'sold some intel to the CIA'},
    {'used':false,'type':1,'health':0,'money':1000000,'disease':null,'diseaseRate':0,'description':'You hacked into Sony picture`s computer, and sold the personal information including social security numbers of the top 10 celebrities for $1 million to a Russian group.','brief':'hacked Sony. Surprise, surprise.'},
    {'used':false,'type':1,'health':0,'money':200000,'disease':null,'diseaseRate':0,'description':'You have made a video and received 1 million hits after posting it on YouTube.  You made just about 20 cents per hit this month.','brief':null},
    {'used':false,'type':1,'health':50,'money':0,'disease':null,'diseaseRate':0,'description':'Scientists have found a cure for cancer. Your health is increased by 50 points. Even if you don`t have cancer. Because why not?','brief':'got healed of cancer'},
    {'used':false,'type':1,'health':10,'money':0,'disease':null,'diseaseRate':0,'description':'Scientists have invented a sleeping aid that helps you. Your health is increased by 10 points.','brief':'got some help sleeping'},
    {'used':false,'type':1,'health':15,'money':0,'disease':null,'diseaseRate':0,'description':'A drugstore is having all the medicine on sale and now you can afford for a medicine that you really need.  Your health is increased by 15 points.','brief':'picked up some meds'},
    {'used':false,'type':1,'health':30,'money':0,'disease':null,'diseaseRate':0,'description':'You went to a clinic and had a flu vaccine. Because of you new immunity, your health is increased by 30 points.','brief':'got a flu vaccine'},
    {'used':false,'type':1,'health':80,'money':0,'disease':null,'diseaseRate':0,'description':'The clinican found out that you have a genetic resistance to HIV. Your health point is increased by 80 points.','brief':'is resistant to HIV!'},
    {'used':false,'type':1,'health':50,'money':0,'disease':null,'diseaseRate':0,'description':'You had a vaccination for TB. Your health is increased by 50 points.','brief':'got vaccinated for TB'},
    {'used':false,'type':1,'health':10,'money':0,'disease':null,'diseaseRate':0,'description':'You have just completed a routine checkup. Your health is increased by 10 points.','brief':'had a routine checkup'},
    {'used':false,'type':1,'health':20,'money':0,'disease':null,'diseaseRate':0,'description':'You have just completed a routine checkup. Your health is increased by 20 points.','brief':'had a routine checkup'},
    {'used':false,'type':1,'health':30,'money':0,'disease':null,'diseaseRate':0,'description':'You have just completed a routine checkup. Your health is increased by 30 points.','brief':'had a routine checkup'},
    {'used':false,'type':1,'health':40,'money':0,'disease':null,'diseaseRate':0,'description':'You have just completed a routine checkup. Your health is increased by 40 points.','brief':'had a routine checkup'},
    {'used':false,'type':1,'health':50,'money':0,'disease':null,'diseaseRate':0,'description':'You have just completed a routine checkup. Your health is increased by 50 points.','brief':'had a routine checkup'},
    {'used':false,'type':1,'health':10,'money':0,'disease':null,'diseaseRate':0,'description':'You are taking steps for a better life by doing regular exercise.  Your health is increased by 10 points.','brief':'started exercising'},
    {'used':false,'type':1,'health':20,'money':0,'disease':null,'diseaseRate':0,'description':'You are taking steps for a better life by doing regular exercise.  Your health is increased by 20 points.','brief':'started exercising'},
    {'used':false,'type':1,'health':30,'money':0,'disease':null,'diseaseRate':0,'description':'You are taking steps for a better life by doing regular exercise.  Your health is increased by 30 points.','brief':'started exercising'},
    {'used':false,'type':1,'health':40,'money':0,'disease':null,'diseaseRate':0,'description':'You are taking steps for a better life by doing regular exercise.  Your health is increased by 40 points.','brief':'started exercising'},
    {'used':false,'type':1,'health':50,'money':0,'disease':null,'diseaseRate':0,'description':'You are taking steps for a better life by doing regular exercise.  Your health is increased by 50 points.','brief':'started exercising'},
    {'used':false,'type':1,'health':100,'money':0,'disease':null,'diseaseRate':0,'description':'You were admitted to the hospital and completely cure for a disease.  Your health is increased by 100 points.','brief':'went to the hospital and got healed'},
    {'used':false,'type':1,'health':50,'money':0,'disease':null,'diseaseRate':0,'description':'You were air-lifted to emergency that saved your life.  Your health is increased by 50 points.','brief':'got airlifted to safety'}
  ];
}

var initializeLCCards=function(){
  lcCards=[    
    {'used':false,'type':2,'health':-50,'money':0,'disease':null,'diseaseRate':0,'description':'You have contracted an incurable form of ebola. You lose 50 health points.','brief':'got ebola!'},
    {'used':false,'type':2,'health':-50,'money':0,'disease':null,'diseaseRate':0,'description':'You had an intercourse with a sex worker in Europe who has HIV.  You lose 50 health points.','brief':'got HIV!'},
    {'used':false,'type':2,'health':-50,'money':1000000,'disease':null,'diseaseRate':0,'description':'You had a blood transfusion and infected with HIV.  You lose 50 health points. You sued the hospital and received $1,000,000 in compensation.','brief':null},
    {'used':false,'type':2,'health':-50,'money':0,'disease':null,'diseaseRate':0,'description':'You are infected with a drug-resistant form of Tuberculosis. You lose 50 health points.','brief':'got tuberculosis!'},
    {'used':false,'type':2,'health':-50,'money':0,'disease':null,'diseaseRate':0,'description':'You are infected with Creutzfeldt-Jakob disease (Mad cow diease).  You lose 50 health points.','brief':'got the Mad Cow disease.'},
    {'used':false,'type':2,'health':-25,'money':0,'disease':null,'diseaseRate':0,'description':'You have been infected with infectious diarrhea.  Your health is now cut by 25 points.','brief':'got infectious diarrhea'},
    {'used':false,'type':2,'health':-25,'money':0,'disease':null,'diseaseRate':0,'description':'You have been infected with malaria. Your health is now cut by 25 points.','brief':'got malaria'},
    {'used':false,'type':2,'health':-25,'money':0,'disease':null,'diseaseRate':0,'description':'You have been infected with rabies. Your health is now cut by 25 points.','brief':'got rabies!'},
    {'used':false,'type':2,'health':-25,'money':0,'disease':null,'diseaseRate':0,'description':'You have been infected with marburg hemorraghic fever. Your health is now cut by 25 points.','brief':'got marburg hemorraghic fever...whatever that is.'},
    {'used':false,'type':2,'health':-25,'money':0,'disease':null,'diseaseRate':0,'description':'You have been infected with Middle East respiratory syndrome (MERS)  Your health is now cut by 25 points.','brief':'got MERS'},
    {'used':false,'type':2,'health':-25,'money':0,'disease':null,'diseaseRate':0,'description':'You have been diagnosed with Acute Lymphoblastic Leukemia (ALL). Your health is now cut by 25 points.','brief':'got Acute Lymphoblastic Leukemia! D:'},
    {'used':false,'type':2,'health':-25,'money':0,'disease':null,'diseaseRate':0,'description':'You have been diagnosed with Acute Myeloid Leukemia (AML).  Your health is now cut by 25 points.','brief':'got Acute Myeloid Leukemia'},
    {'used':false,'type':2,'health':-25,'money':0,'disease':null,'diseaseRate':0,'description':'You have been diagnosed with Adrenocortical Carcinoma. Your health is now cut by 25 points.','brief':'got Adrenocortical Carcinoma!'},
    {'used':false,'type':2,'health':-25,'money':0,'disease':null,'diseaseRate':0,'description':'You have been diagnosed with Kaposi Sarcoma. Your health is now cut by 25 points.','brief':' got Kaposi Sarcoma'},
    {'used':false,'type':2,'health':-25,'money':0,'disease':null,'diseaseRate':0,'description':'You have been diagnosed with Lymphoma. Your health is now cut by 25 points.','brief':'got Lymphoma'},
    {'used':false,'type':2,'health':-10,'money':0,'disease':null,'diseaseRate':0,'description':'You have been infected with H5N1 flu. Your health is now cut by 10 points.','brief':'got the H1N1 flu!'},
    {'used':false,'type':2,'health':-10,'money':0,'disease':null,'diseaseRate':0,'description':'You have been infected with H7N9 flu. Your health is now cut by 10 points','brief':'got the H7N9 flu'},
    {'used':false,'type':2,'health':-10,'money':0,'disease':null,'diseaseRate':0,'description':'You have been infected with pneumonia. Your health is now cut by 10 points.','brief':'got pneumonia'},
    {'used':false,'type':2,'health':-10,'money':0,'disease':null,'diseaseRate':0,'description':'You have been infected with Middle East respiratory syndrome (MERS). Your health is now cut by 10 points.','brief':'got MERS'},
    {'used':false,'type':2,'health':-10,'money':0,'disease':null,'diseaseRate':0,'description':'You have been diagnosed with Anal Cancer. Your health is now cut by 10 points.','brief':'got anal cancer. Ouch.'},
    {'used':false,'type':2,'health':-10,'money':0,'disease':null,'diseaseRate':0,'description':'You have been diagnosed with Appendix Cancer. Your health is now cut by 10 points.','brief':'got appendix cancer.'},
    {'used':false,'type':2,'health':-10,'money':0,'disease':null,'diseaseRate':0,'description':'You have been diagnosed with Astrocytomas. Your health is now cut by 10 points.','brief':null},
    {'used':false,'type':2,'health':-10,'money':0,'disease':null,'diseaseRate':0,'description':'You have been diagnosed with Basal Cell Carcinoma. Your health is now cut by 10 points.','brief':'gpt basal cell carcinoma'},
    {'used':false,'type':2,'health':-10,'money':0,'disease':null,'diseaseRate':0,'description':'You have been diagnosed with Bile Duct Cancer. Your health is now cut by 10 points.','brief':'got bile duct cancer'},
    {'used':false,'type':2,'health':-10,'money':0,'disease':null,'diseaseRate':0,'description':'You have been diagnosed with Bladder Cancer. Your health is now cut by 10 points.','brief':'got bladder cancer'}
  ];
}

var initializeGFCards=function(){
  gfCards=[
    {'used':false,'type':3,'health':0,'money':1000000,'disease':null,'diseaseRate':0,'description':'You have won the "Who Wants to Be a Millionaire" game and received the $1,000,000 grant prize','brief':'won "Who Wants to Be a Millionaire"!'},
    {'used':false,'type':3,'health':0,'money':100000,'disease':null,'diseaseRate':0,'description':'You have won the "Pick 4" lottery for $100,000','brief':'won the lottery!'},
    {'used':false,'type':3,'health':0,'money':100000,'disease':null,'diseaseRate':0,'description':'You have inherited $100,000 from your family.','brief':'inherited some cash'},
    {'used':false,'type':3,'health':0,'money':5000,'disease':null,'diseaseRate':0,'description':'You have provided information that led to the arrest of a terrorist and were awarded $5,000 by the FBI.','brief':'caught a terrorist'},
    {'used':false,'type':3,'health':0,'money':5000,'disease':null,'diseaseRate':0,'description':'You have provided information that led to the finding of a missing child and was award $5,000.','brief':'found a missing child!'},
    {'used':false,'type':3,'health':0,'money':5000,'disease':null,'diseaseRate':0,'description':'As the year-end bonus, your company has given you a $5,000 bonus package.','brief':'received a year-end bonus'},
    {'used':false,'type':3,'health':0,'money':5000,'disease':null,'diseaseRate':0,'description':'You have found a new job and your new employer has given you a $5,000 sign-up bonus.','brief':'got a sign-up bonus'},
    {'used':false,'type':3,'health':0,'money':5000,'disease':null,'diseaseRate':0,'description':'Someone has hit your car and the insurance company has given you a check for $5,000 to repair the damage.','brief':'got some insurance money'},
    {'used':false,'type':3,'health':0,'money':5000,'disease':null,'diseaseRate':0,'description':'You are invited to speak in a conference for $5,000.','brief':'made some money speaking at a conference'},
    {'used':false,'type':3,'health':0,'money':1000,'disease':null,'diseaseRate':0,'description':'You have provided information that led to the arrest of a cyber criminal and were awarded $1,000 by the FBI.','brief':'caught a cyber criminal!'},
    {'used':false,'type':3,'health':0,'money':1000,'disease':null,'diseaseRate':0,'description':'You have created a webpage for a car dealership and were paid $1,000 for your effort.','brief':'created a web page and made some moolah'},
    {'used':false,'type':3,'health':0,'money':1000,'disease':null,'diseaseRate':0,'description':'As the year-end bonus, your company has given you a $1,000 bonus package.','brief':'received a year-end bonus'},
    {'used':false,'type':3,'health':0,'money':1000,'disease':null,'diseaseRate':0,'description':'You have hacked into Paypal and transferred $1,000 into your checking account.','brief':'hacked into PayPal and stole some dough.'},
    {'used':false,'type':3,'health':0,'money':1000,'disease':null,'diseaseRate':0,'description':'You are moving to a new job and your new employer has given you  $1,000 to cover your moving expenses.','brief':'got compensated for moving'},
    {'used':false,'type':3,'health':0,'money':1000,'disease':null,'diseaseRate':0,'description':'While taking a taxi in Las Vegas, you found a bag containing $1,000 cash.','brief':'found some money in a cab'},
    {'used':false,'type':3,'health':0,'money':1000,'disease':null,'diseaseRate':0,'description':'You have won a local singing contest and were award $1,000.','brief':'won a singing contest'},
    {'used':false,'type':3,'health':0,'money':500,'disease':null,'diseaseRate':0,'description':'You have won a Bingo game and were awarded $500.','brief':'won a bingo game'},
    {'used':false,'type':3,'health':0,'money':500,'disease':null,'diseaseRate':0,'description':'You have traded in your old car for $500.','brief':'traded in a car for some money'},
    {'used':false,'type':3,'health':0,'money':500,'disease':null,'diseaseRate':0,'description':'As the year-end bonus, your company has given you a $500 bonus package.','brief':'received a year-end bonus'},
    {'used':false,'type':3,'health':0,'money':500,'disease':null,'diseaseRate':0,'description':'You sold a table tennis racket on ebay for $500.','brief':'Sold some junk on eBay'},
    {'used':false,'type':3,'health':0,'money':500,'disease':null,'diseaseRate':0,'description':'You have given up a seat on an over-booked flight to another passenger and the airline has awarded you $500.','brief':'gave up an airline seat for compensation.'},
    {'used':false,'type':3,'health':0,'money':500,'disease':null,'diseaseRate':0,'description':'You have received a credit refund check from the IRS for $500.','brief':'got a tax return'},
    {'used':false,'type':3,'health':0,'money':500,'disease':null,'diseaseRate':0,'description':'You have won a local dancing contest and was award $500.','brief':'won a dancing contest'},
    {'used':false,'type':3,'health':0,'money':500,'disease':null,'diseaseRate':0,'description':'You have found large amount of money on a taxi, of which you returned to the owner and received a reward for $500.','brief':'was a good citizen'}
  ];
}

var initializeCards=function(){
  initializeGFCards();
  initializeLCCards();
  initializeGenCards();
}

var initializeRollResult=function(){
  rResult={'roll':0,'spaceType':0,'newLocation':0,'cardContent':null};
}

var generateRollResult=function(name1){
  rResult.roll=Math.floor((Math.random() * 12) + 1);
  for(i=0;i<4;++i){
    if(players[i].name==name1){
      players[i].location=(players[i].location+rResult.roll)%40;
      rResult.newLocation=players[i].location;
    }
  }
  rResult.spaceType=1;
  rResult.cardContent="YOU GOT SHOT. BRO...YOU OKAY?";
  return rResult;
} 

var nextUpdate=function(endingPlayer){
  boardUpdate.p1=players[0].location;
  boardUpdate.p2=players[1].location;
  boardUpdate.p3=players[2].location;
  boardUpdate.p4=players[3].location;
  for(i=0;i<4;++i){
      if(players[i].name==endingPlayer){
        boardUpdate.currPlayer=players[(i+1)%4].name;
      }
    }
  return boardUpdate;
}

var getCardType=function(spaceNumber){
  switch(spaceNumber){
    case 0:
    case 1:return 4;
    case 15:
    case 30:return 2;
    case 20:
    case 35:return 3;
    default: return 1;
  }
}

var getRandomCard=function(cardType){
  switch(cardType){
    case 1: return genCards[Math.floor((Math.random() * genCards.length))];
    case 2: return lcCards[Math.floor((Math.random() * lcCards.length))];
    case 3: return gfCards[Math.floor((Math.random() * gfCards.length))];
    case 4: return null;//Hospital space
  }
}

initializePlayers();
initializeUpdate();
initializeRollResult();
initializeCards();
console.log("::Players & Cards initialized::");