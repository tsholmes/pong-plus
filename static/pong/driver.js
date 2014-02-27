// pong/driver.js

function JSONSock(prefix,log) {
  var t = this;
  this.log = log;
  var sock = this.sock = new SockJS(prefix);
  sock.onopen = function() {
    log("socket open");
    t.onopen && t.onopen();
  }
  sock.onmessage = function(e) {
    var d = JSON.parse(e.data);
    t.onmessage && t.onmessage(d);
  }
  sock.onclose = function() {
    console.log("socket close");
    t.onclose && t.onclose();
  }
}
JSONSock.prototype.send = function(d) {
  this.sock.send(JSON.stringify(d));
}
JSONSock.prototype.close = function() {
  if (this.sock.readyState < 2)
    this.sock.close();
}

function RollingSum(count,def) {
  this.count = count;
  this.def = def;
  this.vals = [];
  this.sum = 0;
  this.average = def;
}
RollingSum.prototype.add = function(val) {
  this.vals.push(val);
  this.sum += val;
  while (this.vals.length > this.count) {
    this.sum -= this.vals.shift();
  }
  this.average = (this.sum / this.vals.length) | 0;
}
RollingSum.prototype.clear = function() {
  this.sum = 0;
  this.average = this.def;
  this.vals = [];
}

function GameDriver(view,log) {
  var t = this;
  this.view = view;
  this.running = false;
  this.rtt = 100;
  this.rtts = new RollingSum(10,100);
  this.exf = 0;
  this.len = 3;
  this.last = +new Date();
  this.lastp = +new Date();
  this.log = log;

  this.p1dd = [];
  this.p2dd = [];
  this.frame = 0;

  this.setupSocket();
  this.setupKeyboard();
  this.iid = setInterval(function() {
    t.tick();
  }, 33);
}
GameDriver.prototype.setupKeyboard = function() {
  var t = this;
  var down = 0;
  var up = 0;
  var ld = 0;
  var update = function() {
    if (!t.running) return;
    var dir = down - up;
    if (dir == ld) return;
    ld = dir;
    var f = t.frame+1;
    if (f in t.p1dd) f++;
    t.p1dd[f] = dir;
    t.sock.send({
      e: "dd",
      dd: {
        frame: f,
        dir: dir
      }
    });
  }
  keyListen("S", function() {
    down = 1; update();
  }, function() {
    down = 0; update();
  });
  keyListen("W", function() {
    up = 1; update();
  }, function() {
    up = 0; update();
  });
}
GameDriver.prototype.setupSocket = function() {
  var t = this;

  var oldsock = this.sock;
  var sock = this.sock = new JSONSock("/ws",t.log);
  sock.onopen = function() {

  }
  sock.onmessage = function(d) {
    if (t.sock != sock) return;
    // TODO
    if (d.e == "ping") { // respond to partner ping
      sock.send({e:"pong",t:d.t});
    } else if (d.e == "pong") { // get ping response
      var dif = +new Date() - d.t;
      t.processRTT(dif);
    } else if (d.e == "c") { // partner connected
      t.log("partner connect");
      t.newGame(d.i);
    } else if (d.e == "dc") { // partner disconnect
      t.log("partner disconnect");
      t.running = false;
    } else if (d.e == "s") { // state (TEMP)
      t.collectState(d.s);
    } else if (d.e == "dd") {
      t.processDD(d.dd);
    } else if (d.e == "sy") {
      t.processSync(d.f);
    }
  }
  sock.onclose = function() {
    if (t.sock == sock) {
      t.running = false;
      t.setupSocket();
    }
  }

  if (oldsock)
    oldsock.close();
}
GameDriver.prototype.newGame = function(i) {
  var t = this;

  this.model = new GameModel();
  this.model.ball.states[0].dx = 5 * (-1 + 2 * i);
  this.frame = 0;
  this.p1dd = [];
  this.p2dd = [];
  this.running = true;
  this.last = +new Date();
  this.rtts.clear();
  this.rtt = 100;
  this.exf = 0;
}
GameDriver.prototype.collectState = function(state) {
  // TODO
}
GameDriver.prototype.processRTT = function(rtt) {
  this.rtts.add(rtt);
  this.rtt = this.rtts.average;
  this.log("RTT: " + this.rtt);
}
GameDriver.prototype.processDD = function(dd) {
  this.p2dd[dd.frame] = dd.dir;
  var target = this.frame;
  if (dd.frame <= this.frame) {
    this.frame = dd.frame - 1;
    while (this.frame < target) {
      this.simFrame();
    }
  }
}
GameDriver.prototype.processSync = function(f) {
  var exf = (f + this.rtt / this.len / 2) | 0;
  var lag = this.exf - exf;
  this.log("frame lag: " + lag);
}
GameDriver.prototype.tick = function() {
  if (!this.running) return;
  var df = ((+new Date() - this.last) / this.len) | 0;
  this.exf += df;
  var target = this.exf;
  if (this.model.ball.states[this.frame].dx > 0) {
    target - (this.rtt / this.len) | 0;
  }
  var run = clamp(target - this.frame, 9, 11);
  this.last += df * this.len;
  for (var i = 0; i < run; i++) {
    this.simFrame();
  }
  if (+new Date() - this.lastp > 750) {
    this.lastp += 750;
    this.sock.send({
      e: "ping",
      t: +new Date()
    });
    this.sock.send({
      e: "sy",
      f: this.exf
    });
  }
  var s = this.model.getState(this.frame);
  this.view.setState(s);
  /*this.sock.send({
    e: "s",
    s: s
  });*/
}
GameDriver.prototype.simFrame = function() {
  var f = this.frame;
  var m = this.model;
  var s = m.p1.speed;
  var p1 = m.p1.states[f];
  var p2 = m.p2.states[f];
  var b = m.ball.states[f];
  this.frame = ++f;

  var np1 = {};
  np1.dir = (f in this.p1dd)?this.p1dd[f]:p1.dir;
  np1.pos = clamp(p1.pos+s*np1.dir, 250, 1750);

  var np2 = {};
  np2.dir = (f in this.p2dd)?this.p2dd[f]:p2.dir;
  np2.pos = clamp(p2.pos+s*np2.dir, 250, 1750);

  var nb = {
    dx: b.dx,
    dy: b.dy,
    x: b.x+b.dx,
    y: b.y+b.dy
  };
  // bounce logic
  if (nb.y < 50) {
    nb.y = 2 * 50 - nb.y;
    nb.dy = -nb.dy;
  } else if (nb.y > 1950) {
    nb.y = 2 * 1950 - nb.y;
    nb.dy = -nb.dy;
  }
  if (nb.x < 150 && Math.abs(nb.y - np1.pos) < 300) {
    nb.x = 150 * 2 - nb.x;
    nb.dx = -nb.dx;
    nb.dy += np1.dir;
  } else if (nb.x < 50) {
    nb.x = 2000;
    nb.y = 1000;
    nb.dx = 5;
    nb.dy = 5;
  }
  if (nb.x > 3850 && Math.abs(nb.y - np2.pos) < 300) {
    nb.x = 3850 * 2 - nb.x;
    nb.dx = -nb.dx;
    nb.dy += np2.dir;
  } else if (nb.x > 3950) {
    nb.x = 2000;
    nb.y = 1000;
    nb.dx = -5;
    nb.dy = 5;
  }

  m.p1.addState(f,np1);
  m.p2.addState(f,np2);
  m.ball.addState(f,nb);
}
