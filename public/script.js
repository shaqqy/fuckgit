//Variables and such
var player1;
var player2;
var currentPlayer = 1;
var player1Color = 'red';
var player2Color = 'blue';
const playerTurn = document.querySelector('.player-turn');
var tableRows = document.getElementsByTagName('tr');
var tableCells = document.getElementsByTagName('td');
const reset = document.querySelector('.reset');

//For Server-Client functionality
const socket = io();
let enemyReady = false;
let ready = true;
let playerNum;
let canReset = false;

//custom move class
class Move {
    constructor(column, color, turn) {
        this.column = column;
        this.color = color;
        this.turn = turn;
    }
}

//Flow
//Initial Table setup
for (let i = 0; i < tableCells.length; i++) {
    tableCells[i].addEventListener('click', changeColorPlayer);
    tableCells[i].style.backgroundColor = 'white';
}
reset.addEventListener('click', resetBoard);

socket.on('player-number', num => {
    playerNum = parseInt(num);
    console.log(playerNum);
    let player;
    let temp = playerNum+1;
    if (playerNum >= 0) {
        player = `.p${temp}`;
        console.log(player);
    }
    if (player) {
        document.querySelector(`${player} .connected span`).classList.toggle('green');
        socket.emit('player-connected');
        if (playerNum === 0) {
            while (!player1) {
                player1 = prompt("Please enter your name Player1");
            }
            document.querySelector(`${player} .name`).textContent = player1;
            canReset = true;
            socket.emit('player-name', player1);
        } else {
            while (!player2) {
                player2 = prompt("Prompt please enter your name Player2");
            }
            document.querySelector(`${player} .name`).textContent = player2;
            socket.emit('player-name', player2);
            canReset = true;
        }
        playerReady(playerNum);
        socket.emit('player-ready');
        //socket.emit('player-sync');
    } else {
        alert("Sorry Server is full!");
    }
})

socket.on('enemy-ready', enemy => {
    console.log(enemy);
    let temp = parseInt(enemy.index) + 1;
    let player = `.p${temp}`;
    console.log(player);
    document.querySelector(`${player} .name`).textContent = enemy.name;
    document.querySelector(`${player} .connected span`).classList.toggle('green');
    playerReady(parseInt(enemy.index));
    socket.emit('player-sync')
    player2 = enemy.name;
    playerTurn.textContent = player1;
})

socket.on('player-connected', num => {
    let temp = parseInt(num) + 1;
    console.log(`Player ${temp} has connected or disconnected`);
    let player = `.p${temp}`;
    document.querySelector(`${player} .connected span`).classList.toggle('green');
})
socket.on('player-synced', players => {
    let temp = parseInt(players.index) + 1;
    let player = `.p${temp}`;
    document.querySelector(`${player} .connected span`).classList.toggle('green');
    document.querySelector(`${player} .name`).textContent = players.name;
    player1 = players.name;
    playerReady(parseInt(players.index));
    playerTurn.textContent = player1;
    
})
socket.on('enemy-move', move => {
    changeColor(move);
})
socket.on('board-clear', () => {
    resetBoard();
})


//Function Definitions
function changeColorPlayer(e) {
    let column = e.target.cellIndex;
    let row = [];
    if (playerNum+1 === currentPlayer) {
    for (let i = 5; i >= 0; i--) {
            if (tableRows[i].children[column].style.backgroundColor === 'white') {
                row.push(tableRows[i].children[column]);
                if (currentPlayer === 1) {
                    row[0].style.backgroundColor = player1Color;
                    if (winCheck()) {
                        console.log("won");
                        let move = new Move(column, player1Color, 2);
                        socket.emit('player-move', move);
                        return (alert(`${player1} won`));
                    }
                    playerTurn.textContent = `${player2}'s turn!`;
                    let move = new Move(column, player1Color, 2);
                    socket.emit('player-move', move);
                    break;
                } else if (currentPlayer === 2) {
                    row[0].style.backgroundColor = player2Color;
                    if (winCheck()) {
                        console.log("won");
                        let move = new Move(column, player2Color, 1);
                        socket.emit('player-move', move);
                        return (alert(`${player2} won`));
                    }
                    let move = new Move(column, player2Color, 1);
                    socket.emit('player-move', move);
                    playerTurn.textContent = `${player1}'s turn!`
                    break;
                }
            }
        }
    }
}

function changeColor(e) {
    let column = e.column;
    let row = [];
    currentPlayer = parseInt(e.turn);
    if (currentPlayer === 1) {
        playerTurn.textContent = player1;
    } else {
        playerTurn.textContent = player2;
    }
    for (let i = 5; i >= 0; i--) {
        if (tableRows[i].children[column].style.backgroundColor === 'white') {
            row.push(tableRows[i].children[column]);
            row[0].style.backgroundColor = e.color;
            switch (parseInt(e.turn)) {
                case 1:
                    if (winCheck()) {
                        return (alert(`${player2} won!`))
                    }
                    break;
                case 2:
                    if (winCheck()) {
                        return (alert(`${player1} won!`));
                    }
            }
        }
    }
}

function resetBoard() {
    if (canReset) {
    for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 6; j++) {
                tableRows[j].children[i].style.backgroundColor = 'white';
            }
        }
        socket.emit('board-clear')
        return currentPlayer === 1 ? playerTurn.textContent = `${player1}'s turn` : playerTurn.textContent = `${player2}'s turn`;
    }
}

function playerReady(num) {
    let temp = parseInt(num);
    document.querySelector(`.p${temp + 1} .ready span`).classList.toggle('green');
}

function colorMatchCheck(one, two, three, four) {
    return (one === two && one === three && one === four && one !== 'white');
}

function horizontalCheck() {
    for (let row = 0; row < tableRows.length; row++) {
        for (let col = 0; col < 4; col++) {
            if (colorMatchCheck(tableRows[row].children[col].style.backgroundColor, tableRows[row].children[col + 1].style.backgroundColor, tableRows[row].children[col + 2].style.backgroundColor, tableRows[row].children[col + 3].style.backgroundColor)) {
                return true;
            }
        }
    }
}

function verticalCheck() {
    for (let col = 0; col < 7; col++) {
        for (let row = 5; row >= 3; row--) {
            if (colorMatchCheck(tableRows[row].children[col].style.backgroundColor, tableRows[row - 1].children[col].style.backgroundColor, tableRows[row - 2].children[col].style.backgroundColor, tableRows[row - 3].children[col].style.backgroundColor)) {
                return true;
            }
        }
    }
}

function bottomUpCheck() {
    for (let row = 3; row < tableRows.length; row++) {
        for (let col = 0; col < 4; col++) {
            if (colorMatchCheck(tableRows[row].children[col].style.backgroundColor, tableRows[row - 1].children[col + 1].style.backgroundColor, tableRows[row - 2].children[col + 2].style.backgroundColor, tableRows[row - 3].children[col + 3].style.backgroundColor)) {
                return true;
            }
        }
    }
}

function topDownCheck() {
    for (let row = 0; row < tableRows.length - 3; row++) {
        for (let col = 0; col < 4; col++) {
            if (colorMatchCheck(tableRows[row].children[col].style.backgroundColor, tableRows[row + 1].children[col + 1].style.backgroundColor, tableRows[row + 2].children[col + 2].style.backgroundColor, tableRows[row + 3].children[col + 3].style.backgroundColor)) {
                return true;
            }
        }
    }
}
function winCheck() {
    if (horizontalCheck() || verticalCheck() || bottomUpCheck() || topDownCheck()) {
        return true
    }
}


//LEGEACY STUFF FOLLOWS

////$(document).ready(function () {
//var tableRows = document.getElementsByTagName('tr');
//var tableCells = document.getElementsByTagName('td');
//var tableSlots = document.querySelector('.slot');
//const playerTurn = document.querySelector('.player-turn');
//var pp = document.querySelector('.p1 .name');

//const reset = document.querySelector('.reset');

////some quality of life variables
//player2Color = 'blue';
//var currentPlayer = 1;
//playerTurn.textContent = `${player1}'s turn`;
//player1Color = 'red';

////additional stuff for the server functionality
//let playerNum = 0;
//const socket = io();
//let enemyReady = false;
//let ready = false;
//var player1;
//var player2;

////FLOW
////initial setup of the table and it's cells and links the cells to the click function
//for (let i = 0; i < tableCells.length; i++) {

//    tableCells[i].addEventListener('click', changeColor);
//    tableCells[i].style.backgroundColor = 'white';
//}

////adds functionality for the reset button: clears all set pieces and passes the turn to the not active player
//reset.addEventListener('click', resetBoard);

////player mapping
//socket.on('player-number', num => {
//    var playerNum = parseInt(num);
//    let player;
//    if (playerNum >= 0) {
//        player = `.p${parseInt(num) + 1}`;
//    }
//    if (player) {
//        document.querySelector(`${player} .connected span`).classList.toggle('green');
//        if (playerNum === 1) {
//            while (!player2) {
//                player2 = prompt("Please enter your name Player 2:");
//            }
//            document.querySelector(`${player} .name`).textContent = player2;
//            socket.emit('player-name', player2);
//            currentPlayer = 2;
//            playerReady(playerNum);
//            console.log(playerNum);
//        } else {
//            while (!player1) {
//                player1 = prompt("Please enter your name Player 1:");
//            }
//            document.querySelector(`${player} .name`).textContent = player1;
//            socket.emit('player-name', player1);
//            currentPlayer = 1;
//            playerReady(playerNum);
//            console.log(playerNum);
//        }
//    } else {
//        alert("Sorry server is full");
//        //playerTurn.textContent = "Sorry the server is already full";
//    }

//    //Get status of other players
//    socket.emit('check-players');
//    playGame(socket);
//})

////Listeners Client Side
////another player has connected or dc
//socket.on('player-connection', num => {
//    console.log(`Player Number ${num} connected or disconnected`);
//    playerConnectedOrDisconnected(num);
//});

////On enemy ready
//socket.on('enemy-ready', num => {
//    enemyReady = true;

//    playerReady(num.index);
//    if (ready) playGame(socket);
//})

////On enemy name
//socket.on('enemy-name', name => {
//    let temp = 0;
//    switch (currentPlayer) {
//        case 1:
//            temp = 2;
//            break;
//        case 2:
//            temp = 1;
//    }
//    let player = `.p${temp}`;
//    document.querySelector(`${player} .name`).textContent = name;
//})

////check player status
//socket.on('check-players', players => {
//    for (let i = 0; i < 2; i++) {
//        if (players[i].connected) playerConnectedOrDisconnected(i);
//        if (players[i].ready) {
//            playerReady(i);
//            if (i !== playerNum) enemyReady = true;
//        };
//        playGame(socket);
//    }
//})


////FUNCTION DECLARATIONS 
////play game
//function playGame(socket) {
//    if (!ready) {
//        socket.emit('player-ready');
//        ready = true;
//        playerReady(playerNum);
//    }
//    if (enemyReady) {
//        if (currentPlayer === 2) {
//            playerTurn.textContent = `${player1}'s turn!`
//        }
//        if (currentPlayer === 1) {
//            playerTurn.textContent = `${player2}'s turn!`
//        }
//    }
//}

////sets ready square to green
//function playerReady(num) {
//    let player = `.p${parseInt(num) + 1}`;
//    document.querySelector(`${player} .ready span`).classList.toggle('green');
//}

////gives a console message if someone connects or disconnects from the game
//function playerConnectedOrDisconnected(num) {
//    console.log('success');
//    let player = `.p${parseInt(num) + 1}`;
//    if (parseInt(num) === 0) {
//        console.log('failure');
//        document.querySelector(`${player} .name`).textContent = player1;
//        document.querySelector(`${player} .connected span`).classList.toggle('green');
//        //document.querySelector(`${player}`).textContent = player1;
//    } else if (parseInt(num) === 1) {
//        console.log('failure');
//        document.querySelector(`${player} .name`).textContent = player2;
//        document.querySelector(`${player} .connected span`).classList.toggle('green');
//    }
//}

////actual "game" fuctionality -> includes a mechanism to keep the game moving
//function changeColor(e) {
//    let column = e.target.cellIndex;
//    let row = [];
//    if (enemyReady) {
//        for (let i = 5; i >= 0; i--) {
//            if (tableRows[i].children[column].style.backgroundColor === 'white') {
//                row.push(tableRows[i].children[column]);
//                if (currentPlayer === 1) {
//                    row[0].style.backgroundColor = player1Color;
//                    if (winCheck()) {
//                        console.log("won");
//                        return (alert(`${player1} won`));
//                    }
//                    playerTurn.textContent = `${player2}'s turn!`
//                    return currentPlayer = 2;
//                } else if (currentPlayer === 2) {
//                    row[0].style.backgroundColor = player2Color;
//                    if (winCheck()) {
//                        console.log("won");
//                        return (alert(`${player2} won`));
//                    }
//                    playerTurn.textContent = `${player1}'s turn!`
//                    return currentPlayer = 1;
//                }
//            }
//        }
//        playGame(socket);
//    }
//}

////while (!player1) {
////    var player1 = prompt('Please enter your name:');
////}



////while (!player2) {
////    var player2 = prompt('Please enter your name:');
////}

//the win Condition Check Part


//function resetBoard() {
//    for (let i = 0; i < 7; i++) {
//        for (let j = 0; j < 6; j++) {
//            tableRows[j].children[i].style.backgroundColor = 'white';
//        }
//    }
//    return currentPlayer === 1 ? playerTurn.textContent = `${player1}'s turn` : playerTurn.textContent = `${player2}'s turn`;
//}
////});