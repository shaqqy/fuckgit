'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');

//From here on my code:
var http = require('http');
var port = process.env.PORT || 3000;
var socketio = require('socket.io');

let whoseTurn = 0;

var app = express();

const server = http.createServer(app);
const io = socketio(server);

//set static folder for html, css and js
app.use(express.static(path.join(__dirname, "public")));

//start the server
server.listen(port, () => console.log(`Server is listening on Port:${port}`));

class Player {
    constructor(connected, ready, name, index) {
        this.connected = connected;
        this.ready = ready;
        this.name = name;
        this.index = index;
    }
}

//Hande the socket connection (this is where the magic happens)
const connections = [null, null];
io.on('connection', socket => {
    console.log('New Socket Connection');
    //Create the player on the socket so we can easily pass it to clients with full info
    let playerSocket = new Player(false, false, "default", -1);
    let playerIndex = -1;
    //Find an open slot to play and save the slot to the playerindex; set connected to true
    for (const i in connections) {
        if (connections[i] === null) {
            connections[i] = playerSocket;
            playerSocket.index = i;
            playerSocket.connected = true;
            console.log(playerSocket.index);
            playerIndex = i;
            break;
        }
    }
    //Tell the client what player number they are
    socket.emit('player-number', playerIndex);

    //Get the message that the client connected successfully
    socket.on('player-connected', () => {
        socket.broadcast.emit('player-connection', playerSocket.index);
    });
    console.log(`Player ${playerSocket.index} has connected!`);

    //Get the player name
    socket.on('player-name', playerName => {
        playerSocket.name = playerName;
    })

    //Get the message that the client is ready
    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', connections[playerIndex]);
    })
    //Try syncing the clients data => doesn't work so far
    socket.on('player-sync', () => {
        socket.broadcast.emit('player-synced', connections[playerIndex]);    
    })
    //Handling of the moves a player takes
    socket.on('player-move', move => {
        socket.broadcast.emit('enemy-move', move);
    })
    //Pressing the Clear button also clears the other players board
    socket.on('board-clear', () => {
        socket.broadcast.emit('board-clear');
    })
    
    //Handling of too many players
    if (playerSocket.index === -1) {
        return;
    }
    //Disconnect Handling
    socket.on('disconnect', () => {
        console.log(`Player ${playerSocket.index} disconnected`);
        connections[playerSocket.index] = null;
        //Broadcast free slot number
        socket.broadcast.emit('player-connection', playerSocket.index);
    })
    

});