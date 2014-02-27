// dispatch.js

var sockjs = require("sockjs");
var _ = require("underscore");

function Connection(id, conn, data, close) {
  var t = this;
  this.id = id;
  this.conn = conn;
  var alive = false;
  var i = setInterval(function(){
    if (alive) {
      alive = false;
      return;
    }
    try {
      conn._session.recv.didClose();
    } catch (e) {}
  },1000);
  conn.on('data', function(d) {
    alive = true;
    data(t, JSON.parse(d));
  });
  conn.on('close', function() {
    clearInterval(i); close(t);
  });
}

Connection.prototype.send = function(data) {
  this.conn.write(JSON.stringify(data));
}

function Dispatcher() {
  this._nextid = 0;
  this.conns = {};
  this.waiting = null;
  this.partners = {};
}

Dispatcher.prototype.registerConn = function(conn) {
  var t = this;
  var id = ++this._nextid;
  conn = this.conns[id] = new Connection(id, conn, _.bind(this.onData,this), _.bind(this.onClose,this));
  this.putWait(conn);
  return id;
}

Dispatcher.prototype.onData = function(conn,data) {
  var part = this.partners[conn.id];
  if (part) {
    part.send(data);
  }
}

Dispatcher.prototype.onClose = function(conn) {
  console.log("Connection " + conn.id + " dc");
  if (this.waiting == conn) {
    this.waiting = null;
  } else if (this.partners[conn.id]) {
    var part = this.partners[conn.id];
    delete this.partners[conn.id];
    delete this.partners[part.id];
    part.send({e:"dc"});
    this.putWait(part);
  }
}

Dispatcher.prototype.putWait = function(conn) {
  if (this.waiting) {
    var part = this.waiting;
    this.waiting = null;
    this.partners[conn.id] = part;
    this.partners[part.id] = conn;
    conn.send({e:"c",i:0});
    part.send({e:"c",i:1});
    console.log("Connection pair: " + conn.id + " " + part.id);
  } else {
    this.waiting = conn;
    console.log("Connection " + conn.id + " waiting");
  }
}

module.exports.registerDispatcher = function(server,prefix) {
  var sockserv = sockjs.createServer({
    log: function(severity, message) {
      if (severity == "error") console.log(message);
    }
  });

  var d = new Dispatcher();

  sockserv.on('connection', _.bind(d.registerConn,d));

  sockserv.installHandlers(server, {prefix:prefix});
}
