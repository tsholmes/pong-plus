function documentReady(callback) {
  if (document.readyState != "loading") {
    callback();
  } else {
    var ready = false;
    document.onreadystatechange = function() {
      if (document.readyState != "loading" && !ready) {
        ready = true;
        callback();
      }
    }
  }
}

function clamp(val, min, max) {
  return (val<min)?min:(val>max)?max:val;
}

(function() {
  var downcbs = {};
  var upcbs = {};
  document.onkeydown = function(e) {
    var cb = downcbs[e.keyIdentifier] || downcbs[String.fromCharCode(e.keyCode)];
    if (cb) {
      cb();
    }
  }
  document.onkeyup = function(e) {
    var cb = upcbs[e.keyIdentifier] || upcbs[String.fromCharCode(e.keyCode)];
    if (cb) {
      cb();
    }
  }

  window.keyDown = function(key, cb) {
    downcbs[key] = cb;
  }
  window.keyUp = function(key, cb) {
    upcbs[key] = cb;
  }

  window.keyListen = function(key, dcb, ucb) {
    keyDown(key, dcb);
    keyUp(key, ucb);
  }
})()
