var game;

documentReady(function(){
  game = new Game(document.getElementById("game"),
                  new Paddle(document.getElementById("p1")),
                  new Paddle(document.getElementById("p2")),
                  new Ball(document.getElementById("ball")));
  new KeyboardController(game.p1, "S", "W");
  new KeyboardController(game.p2, "Down", "Up");
  setInterval(function(){game.advance();},33);
  console.log(game);
});


function Paddle(el) {
  this.el = el;
  this.pos = 1000;
  this.dir = 0;
  this.speed = 5;
}

Paddle.prototype.tick = function() {
  this.pos = clamp(this.pos + this.dir * this.speed, 250, 1750);
  this.el.style.top = this.pos / 10;
}


function Ball(el) {
  this.el = el;
  this.x = 2000;
  this.y = 1000;
  this.dx = 5;
  this.dy = 5;
}

Ball.prototype.tick = function(p1, p2) {
  this.x += this.dx;
  this.y += this.dy;
  if (this.y < 50) {
    this.y = 2 * 50 - this.y;
    this.dy = -this.dy;
  } else if (this.y > 1950) {
    this.y = 2 * 1950 - this.y;
    this.dy = -this.dy;
  }
  this.el.style.left = this.x / 10;
  this.el.style.top = this.y / 10;

  if (this.x < 150 && Math.abs(this.y - p1.pos) < 300) {
    this.x = 150 * 2 - this.x;
    this.dx = -this.dx;
    this.dy += p1.dir;
  } else if (this.x < 50) {
    this.x = 2000;
    this.y = 1000;
    this.dx = 5;
    this.dy = 5;
  }
  if (this.x > 3850 && Math.abs(this.y - p2.pos) < 300) {
    this.x = 3850 * 2 - this.x;
    this.dx = -this.dx;
    this.dy += p2.dir;
  } else if (this.x > 3950) {
    this.x = 2000;
    this.y = 1000;
    this.dx = -5;
    this.dy = 5;
  }
}


function Game(el, p1, p2, ball) {
  this.el = el;
  this.p1 = p1;
  this.p2 = p2;
  this.ball = ball;

  this.speed = 10;
}

Game.prototype.tick = function() {
  this.p1.tick();
  this.p2.tick();
  this.ball.tick(this.p1, this.p2);
}

Game.prototype.advance = function() {
  for (var i = 0; i < this.speed; i++) {
    this.tick();
  }
}

function KeyboardController(p, dk, uk) {
  var down = 0;
  var up = 0;

  var update = function(){p.dir = down - up;};

  keyListen(dk, function(){
    down = 1; update();
  }, function() {
    down = 0; update();
  });
  keyListen(uk, function(){
    up = 1; update();
  }, function() {
    up = 0; update();
  });
}
