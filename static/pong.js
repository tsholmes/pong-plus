var game;

documentReady(function(){
  var view = new GameView(new PaddleView(document.getElementById("p1")),
                          new PaddleView(document.getElementById("p2")),
                          new BallView(document.getElementById("ball")));
  var driver = new GameDriver(view);
});
