const express = require('express')
const socket = require('socket.io')
const http = require("http")
const { Chess } = require("chess.js")
const path = require("path")

const app = express()

const server = http.createServer(app)
const io = socket(server)

const chess = new Chess()
let players = {}

app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "public")))

app.get("/", function(req, res){
    res.render("index", { title: "Chess Game" })
})

io.on("connection", function(uniquesocket) {
    console.log("connected");

    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w"); // fix here: uniquesocket not socket
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("move", (move) => {   // move listener inside connection
        try {
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move: ", move);
                uniquesocket.emit("invalidMove", move);
            }
        } catch (err) {
            console.log(err);
            uniquesocket.emit("error", "Invalid move");
        }
    });

    uniquesocket.on("disconnect", function() {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
    });
});

server.listen(3000, function() {
    console.log("listening on port 3000");
});
