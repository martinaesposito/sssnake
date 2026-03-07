var snakeTimer = 0;
const SNAKE_INTERVAL = 6;

var s;
var scl = 40;
var food;

var gameSize, gameX, gameY, gameCols, gameRows;

var autoMode = false;
var lastKeyFrame = -999;
const IDLE_FRAMES = 900;

let ateTime = -5000;

function Snake() {
  this.x = 0;
  this.y = 0;
  this.xspeed = 1;
  this.yspeed = 0;
  this.total = 0;
  this.tail = [];

  this.eat = function (pos) {
    var col_s = round(this.x / scl);
    var row_s = round(this.y / scl);
    var col_f = round(pos.x / scl);
    var row_f = round(pos.y / scl);
    if (col_s === col_f && row_s === row_f) {
      this.total++;
      this.tail.push(createVector(this.x, this.y));
      return true;
    }
    return false;
  };

  this.dir = function (x, y) {
    if (x === -this.xspeed && y === -this.yspeed) return;
    this.xspeed = x;
    this.yspeed = y;
  };

  this.update = function () {
    if (this.tail.length >= this.total) {
      this.tail.splice(0, 1);
    }
    this.tail.push(createVector(this.x, this.y));
    this.x += this.xspeed * scl;
    this.y += this.yspeed * scl;

    if (this.x < 0 || this.x >= gameSize || this.y < 0 || this.y >= gameSize) {
      autoMode = true;
      lastKeyFrame = -999;
      this.x = constrain(this.x, 0, gameSize - scl);
      this.y = constrain(this.y, 0, gameSize - scl);
    }
  };

  this.show = function () {
    snakeLayer.clear();
    snakeLayer.noStroke();

    let border = 1;

    // 1. Disegna la forma espansa (bordo) in bianco
    snakeLayer.fill(255);
    for (var i = 0; i < this.tail.length; i++) {
      snakeLayer.rect(
        gameX + this.tail[i].x - border,
        gameY + this.tail[i].y - border,
        scl + border * 2,
        scl + border * 2,
      );
    }
    snakeLayer.rect(
      gameX + this.x - border,
      gameY + this.y - border,
      scl + border * 2,
      scl + border * 2,
    );

    // 2. Usa destination-out per ritagliare l'interno esatto
    snakeLayer.drawingContext.globalCompositeOperation = "destination-out";
    for (var i = 0; i < this.tail.length; i++) {
      snakeLayer.rect(gameX + this.tail[i].x, gameY + this.tail[i].y, scl, scl);
    }
    snakeLayer.rect(gameX + this.x, gameY + this.y, scl, scl);
    snakeLayer.drawingContext.globalCompositeOperation = "source-over";

    // 3. Ora disegna l'interno in DIFFERENCE sul canvas principale
    blendMode(DIFFERENCE);
    fill(255);
    noStroke();
    for (var i = 0; i < this.tail.length; i++) {
      rect(gameX + this.tail[i].x, gameY + this.tail[i].y, scl, scl);
    }
    rect(gameX + this.x, gameY + this.y, scl, scl);

    // 4. Stampa il bordo (solo outline) sopra in BLEND
    blendMode(BLEND);
    image(snakeLayer, 0, 0);
  };
}

// ─── AUTOPILOTA RANDOM ───────────────────────────
function autoStep() {
  var dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  // No U-turn
  dirs = dirs.filter((d) => !(d.x === -s.xspeed && d.y === -s.yspeed));
  // Solo direzioni che non escono dal bordo (x,y sono pixel)
  dirs = dirs.filter((d) => {
    var nx = s.x + d.x * scl;
    var ny = s.y + d.y * scl;
    return nx >= 0 && nx < gameSize && ny >= 0 && ny < gameSize;
  });
  if (dirs.length > 0) {
    var chosen = random(dirs);
    s.xspeed = chosen.x;
    s.yspeed = chosen.y;
  }
}

function pickLocation() {
  // food in pixel relativi all'area di gioco, allineati alla griglia
  var col = floor(random(gameCols));
  var row = floor(random(gameRows));
  food = createVector(col * scl, row * scl);
}

//
function keyPressed() {
  //   if (key === "c" || key === "C") {
  //     showCurvatureCircle = !showCurvatureCircle;
  //     return;
  //   }

  var moved = false;
  if (keyCode === UP_ARROW) {
    s.dir(0, -1);
    moved = true;
  }
  if (keyCode === DOWN_ARROW) {
    s.dir(0, 1);
    moved = true;
  }
  if (keyCode === RIGHT_ARROW) {
    s.dir(1, 0);
    moved = true;
  }
  if (keyCode === LEFT_ARROW) {
    s.dir(-1, 0);
    moved = true;
  }

  if (moved) {
    autoMode = false;
    lastKeyFrame = frameCount;
  }
}

///
function handleTouch() {
  if (touches.length === 0) return;

  let x = touches[0].x;
  let y = touches[0].y;

  let centerX = width / 2;
  let centerY = height / 2;

  const THRESHOLD = 50;

  let dx = x - centerX;
  let dy = y - centerY;

  if (abs(dx) > abs(dy)) {
    if (dx > THRESHOLD) s.dir(1, 0);
    if (dx < -THRESHOLD) s.dir(-1, 0);
  } else {
    if (dy > THRESHOLD) s.dir(0, 1);
    if (dy < -THRESHOLD) s.dir(0, -1);
  }

  autoMode = false;
  lastKeyFrame = frameCount;
}

function touchStarted() {
  handleTouch();
}

function touchMoved() {
  handleTouch();
  return false;
}

// function setupGyro() {
//   if (
//     typeof DeviceOrientationEvent !== "undefined" &&
//     typeof DeviceOrientationEvent.requestPermission === "function"
//   ) {
//     // iOS 13+ richiede permesso esplicito
//     DeviceOrientationEvent.requestPermission().then((response) => {
//       if (response === "granted") {
//         window.addEventListener("deviceorientation", handleGyro);
//       }
//     });
//   } else {
//     // Android e iOS vecchi — nessun permesso necessario
//     window.addEventListener("deviceorientation", handleGyro);
//   }
// }

// let gyroActive = false;

// function handleGyro(event) {
//   gyroActive = true;
//   let gamma = event.gamma; // inclinazione sinistra/destra: -90 a 90
//   let beta = event.beta; // inclinazione avanti/indietro: -180 a 180

//   const THRESHOLD = 15; // gradi di inclinazione minima — CAMBIA QUI

//   if (abs(gamma) > abs(beta)) {
//     // Movimento dominante: sinistra/destra
//     if (gamma > THRESHOLD) s.dir(1, 0);
//     if (gamma < -THRESHOLD) s.dir(-1, 0);
//   } else {
//     // Movimento dominante: su/giù
//     if (beta > THRESHOLD) s.dir(0, 1);
//     if (beta < -THRESHOLD) s.dir(0, -1);
//   }

//   if (gyroActive) {
//     autoMode = false;
//     lastKeyFrame = frameCount;
//   }
// }
