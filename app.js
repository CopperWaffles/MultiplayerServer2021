//var io = require('socket.io')(process.env.PORT || 5000)
var shortid = require("shortid")

//data server
var express = require('express')
var app = express()
var serv = require('http').Server(app)
var io = require('socket.io')(serv, {})
var mongoose = require('mongoose')

require('./db')

//quicl data model
var User = mongoose.model('User', 
{
    playername:{type:String},
    score:{type:Number},
    gamesPlayed:{type:Number}
})

app.use(express.urlencoded({extended:true}))
app.use(express.json())
//FINAL CODE
app.use(express.static(__dirname +'/views'))

app.get('/', function(req, res)
{
    res.send("index.html")
})

serv.listen(3000, function(){
         console.log("App running on port 3000")
     })

//Get Rout to get data from database
app.get('/download', function(req,res){
    User.find({}).then(function(data){
        res.json({data})
    })
})

//post route to save data from unity
app.post('/upload', function(req,res){
    console.log("Posting Data")
    //create new instance of the model
    var newUser = new User({
        playername:req.body.playername,
        score:req.body.score,
        gamesPlayed:req.body.gamesPlayed
    })

    newUser.save(function(err,result){
        if(err){
            console.log(err)
        }else{
            console.log(result)
        }
    })
})



//socket server code
console.log('server is running')
//console.log(shortid.generate())

var players = []

io.on('connection', function(socket){
    console.log('client connected')

//     socket.broadcast.emit("spawn")
    var clientId = shortid.generate()

    players.push(clientId)

   //spawn new players for existing players
   socket.broadcast.emit('spawn', {id:clientId})

//     // request all existing pos
     socket.broadcast.emit('requestPosition')

//     //players.forEach(function(playerId){
//      //   if(playerId == clientId){
//      //       return
//      //   }
//     //    socket.emit('spawn', {id:client})
//     //    console.log("sending spawn to new player")
//   //  })

    socket.on('hello', function(data){
        console.log("Hello from the connected client")
    })

    players.forEach(function(client)
    {
        if(client == clientId)
        {
            return
        }
        socket.emit('spawn', {id:client})
    })

    socket.on('move', function(data){
        data.id = clientId;
        console.log("Getting positions from client")
        console.log(data)
        socket.broadcast.emit("move", data)
    })

    socket.on('updatePosition', function(data){
        data.id = clientId;
        socket.broadcast.emit('updatePosition', data);
    })

    socket.on('disconnect', function(){
        console.log("player has disconnected")
        players.splice(players.lastIndexOf(clientId),1)
        socket.broadcast.emit('disconnected', {id:clientId})
    })

    //FINAL CODE
    // socket.on('/editNames' , function(data){     
    //     console.log(data.originalName + " " + data.changedName)
    //      User.updateOne({playername:data.originalName}, {playername:data.changedName}, function (err, docs) {})
        
    //  })
    socket.on('/editNames' , function(data){
        console.log(data.originalName + " " + data.changedName)
        User.updateOne({playername:data.originalName}, {playername:data.changedName}, function (err, docs) {})
     })
})