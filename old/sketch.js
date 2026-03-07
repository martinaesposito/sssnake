//SERPENTONE
let time = 0;
let curvature;
let currentPoint;
let currentSegment = null;
let drawIndex = 0;

let drawnCircles = [];
let segmentCount = 0;
let colorPhase = 0;

const CIRCLES_PER_FRAME = 6;
const MAX_SEGMENTS = 3;
let segmentBoundaries = [0]; // segment 0 starts at index 0

let song;
let hiss;
// let font;
// let letters = " .,;xe!S"; // palette caratteri
// let charW = 10; // larghezza cella
// let charH = 10; // altezza cella
// let toneDiv;

function preload() {
  song = loadSound("sound.mp3");
  hiss = loadSound("hiss.mp3");
  //   font = loadFont("ESDokumentTRIAL-CondensedLight.otf");
}

let showCurvatureCircle = true;
let fadingCircles = []; // tutti i cerchi che stanno scomparendo
let lastArc = -1;

function setup() {
  scl = round(height / 7);
  createCanvas(windowWidth, windowHeight);
  noStroke();
  //SNAKE
  gameSize = floor((min(width, height) * 0.7) / scl) * scl;
  gameX = floor((width - gameSize) / 2);
  gameY = floor((height - gameSize) / 2);
  gameCols = floor(gameSize / scl);
  gameRows = floor(gameSize / scl);

  let offset = width / 6;
  currentPoint = {
    x: random(offset, width - offset),
    y: random(offset, height - offset),
    yaw: random(TWO_PI),
  };
  curvature = random(offset / 3, offset / 1);
  generateNewSegment();

  s = new Snake();
  pickLocation();

  song.loop();
  song.setVolume(0);
}

function draw() {
  blendMode(BLEND);
  background(255);

  time += 0.1;

  //SFONDO
  push();
  let r = max(width, height) * 0.8;
  let angle = time * 0.1; // velocità rotazione
  ((x1 = width / 2 + cos(angle) * r), (y1 = height / 2 + sin(angle) * r));
  ((x2 = width / 2 - cos(angle) * r), (y2 = height / 2 - sin(angle) * r));

  let grad = drawingContext.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, "black");
  grad.addColorStop(1, "white");
  drawingContext.fillStyle = grad;
  drawingContext.fillRect(0, 0, width, height);
  pop();

  // Cerchio raggio di curvatura
  if (showCurvatureCircle && currentSegment) {
    drawCurvatureCircle(currentSegment);
  }
  //SERPENTONE DI CERCHI
  push();
  for (let c of drawnCircles) {
    noStroke();
    fill(c.gray);
    circle(c.x, c.y, c.radius);
  }

  // Draw new circles from current segment
  if (currentSegment) {
    for (let f = 0; f < CIRCLES_PER_FRAME; f++) {
      if (drawIndex < currentSegment.px.length) {
        let x = currentSegment.px[drawIndex];
        let y = currentSegment.py[drawIndex];
        let radius = 50 + 45 * sin(colorPhase * 6);
        let gray = 127 + 127 * sin(colorPhase * 8);

        let vol = map(gray, 0, 255, 0, 0.25);
        song.setVolume(vol, 0.5); // 0.1 = smoothing

        drawnCircles.push({ x, y, radius, gray });

        colorPhase += 0.002; // advance phase continuously (was 0.005 per index, now smoother)
        drawIndex++;
      } else {
        segmentCount++;
        segmentBoundaries.push(drawnCircles.length);

        generateNewSegment();
        break;
      }
    }
  }

  if (segmentBoundaries.length > MAX_SEGMENTS) {
    for (let f = 0; f < CIRCLES_PER_FRAME; f++) {
      if (drawnCircles.length > 0) {
        drawnCircles.shift();
        for (let i = 0; i < segmentBoundaries.length; i++) {
          segmentBoundaries[i] = max(0, segmentBoundaries[i] - 1);
        }
      }
    }
  }
  pop();

  justAte = false;
  //SNAKE

  blendMode(DIFFERENCE);

  //drawGameArea();
  drawingContext.strokeStyle = "rgba(255,255,255)";
  drawingContext.lineWidth = 1;
  drawingContext.strokeRect(gameX, gameY, gameSize, gameSize);

  snakeTimer++;

  if (snakeTimer >= SNAKE_INTERVAL) {
    snakeTimer = 0;
    if (frameCount - lastKeyFrame > IDLE_FRAMES) autoMode = true;
    if (autoMode) autoStep();
    if (s.eat(food)) {
      pickLocation();
      ateTime = millis();
      hiss.stop();
      hiss.play();
    }
    s.update();
  }

  s.show();

  // Cibo — quadrato nero
  stroke(255);
  fill(25);
  rect(gameX + food.x, gameY + food.y, scl, scl);

  if (millis() - ateTime < 1000) {
    let elapsed = millis() - ateTime;
    let alpha = map(elapsed, 0, 400, 255, 0);
    fill(255, alpha);
    rect(0, 0, width, height);
    let hissVol = map(elapsed, 0, 1000, 1, 0);
    hiss.setVolume(hissVol);
  }
}

// ─── CERCHIO DI CURVATURA CON FADE ───────────────────────────
function drawCurvatureCircle(seg) {
  let px = seg.px;
  let py = seg.py;
  let pyaw = seg.pyaw;
  let mode = seg.mode;
  let arcs = seg.arcStartIndices;

  // Trova in quale arco siamo ora
  let currentArc = 0;
  for (let i = 1; i < arcs.length; i++) {
    if (drawIndex >= arcs[i]) currentArc = i;
  }

  // Se l'arco è cambiato, salva il vecchio nell'array di fade
  if (currentArc !== lastArc) {
    if (lastArc >= 0 && mode[lastArc] !== "S") {
      let idx = arcs[lastArc];
      let yaw0 = pyaw[idx];
      let perpAngle = mode[lastArc] === "L" ? yaw0 + HALF_PI : yaw0 - HALF_PI;
      fadingCircles.push({
        cx: px[idx] + cos(perpAngle) * curvature,
        cy: py[idx] + sin(perpAngle) * curvature,
        radius: curvature,
        alpha: 0.3,
      });
    }
    lastArc = currentArc;
  }

  // Aggiorna e disegna tutti i cerchi in fade
  drawingContext.lineWidth = 1;
  for (let i = fadingCircles.length - 1; i >= 0; i--) {
    let fc = fadingCircles[i];
    fc.alpha -= 0.01; // lentissimo — cambia questo valore per velocizzare
    if (fc.alpha <= 0) {
      fadingCircles.splice(i, 1);
      continue;
    }
    drawingContext.strokeStyle = `rgba(255,255,255,${fc.alpha})`;
    drawingContext.beginPath();
    drawingContext.arc(fc.cx, fc.cy, fc.radius, 0, TWO_PI);
    drawingContext.stroke();
    drawingContext.closePath();
  }

  // Disegna il cerchio attivo
  let m = mode[currentArc];
  if (m !== "S") {
    let idx = arcs[currentArc];
    let yaw0 = pyaw[idx];
    let perpAngle = m === "L" ? yaw0 + HALF_PI : yaw0 - HALF_PI;
    let cx = px[idx] + cos(perpAngle) * curvature;
    let cy = py[idx] + sin(perpAngle) * curvature;

    drawingContext.strokeStyle = "rgba(255,255,255,0.3)";
    drawingContext.lineWidth = 1;
    drawingContext.beginPath();
    drawingContext.arc(cx, cy, curvature, 0, TWO_PI);
    drawingContext.stroke();
    drawingContext.closePath();

    drawingContext.fillStyle = "rgba(255,255,255,0.5)";
    drawingContext.beginPath();
    drawingContext.arc(cx, cy, 1, 0, TWO_PI);
    drawingContext.fill();
    drawingContext.closePath();
  }
}
