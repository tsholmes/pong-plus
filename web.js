// web.js

var express = require("express");
var dispatch = require("./dispatch");

var app = express();
var server = require("http").createServer(app);
var port = process.env.PORT || 5000;

dispatch.registerDispatcher(server, "/ws");

app.use(express.static(__dirname + "/static"));

app.get("/", function(req, res) {
  res.send("Hello world!");
});

server.listen(port, function(){
  console.log("Listening on " + port);
});
