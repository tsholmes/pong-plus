// pong/view.js

function PaddleView(el) {
  this.el = el;
}
PaddleView.prototype.setState = function(state) {
  this.el.style.top = state.pos / 10;
}

function BallView(el) {
  this.el = el;
}
BallView.prototype.setState = function(state) {
  this.el.style.left = state.x / 10;
  this.el.style.top = state.y / 10;
}

function GameView(p1,p2,ball) {
  this.p1 = p1;
  this.p2 = p2;
  this.ball = ball;
}
GameView.prototype.setState = function(state) {
  this.p1.setState(state.p1);
  this.p2.setState(state.p2);
  this.ball.setState(state.ball);
}
