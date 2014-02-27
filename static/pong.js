var game;

documentReady(function(){
  var view = new GameView(new PaddleView(document.getElementById("p1")),
                          new PaddleView(document.getElementById("p2")),
                          new BallView(document.getElementById("ball")));
  var mq = document.getElementById("mq");
  var driver = new GameDriver(view, function(msg){
    console.log(msg);
    var el = document.createElement("div");
    el.class = "msg";
    el.innerHTML = msg;
    mq.appendChild(el);
    var op = 200;
    var i = setInterval(function(){
      op -= 1;
      el.style.opacity = Math.min(op,100) / 100;
      if (op <= 0) {
        mq.removeChild(el);
        clearInterval(i);
      }
    }, 20);
  });
});
