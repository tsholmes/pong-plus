// pong/model.js

function PaddleModel() {
  this.speed = 5;
  this.states = [{pos:1000,dir:0}];
}
PaddleModel.prototype.addState = function(frame,state) {
  this.states[frame] = state;
}

function BallModel() {
  this.states = [{x:2000,y:1000,dx:5,dy:5}];
}
BallModel.prototype.addState = function(frame,state) {
  this.states[frame] = state;
}

function GameModel() {
  this.p1 = new PaddleModel();
  this.p2 = new PaddleModel();
  this.ball = new BallModel();
}
GameModel.prototype.getState = function(frame) {
  return {
    frame: frame,
    p1: this.p1.states[frame],
    p2: this.p2.states[frame],
    ball: this.ball.states[frame]
  };
}
