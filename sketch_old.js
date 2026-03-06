let time = 0;

let v; //video

let font;
let letters = " .,;xe!S"; // palette caratteri
let charW = 10; // larghezza cella
let charH = 10; // altezza cella
let toneDiv;

function preload() {
  font = loadFont("ESDokumentTRIAL-CondensedLight.otf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(font, 14);
  textAlign(LEFT, TOP);
  noStroke();

  console.log(font);
  toneDiv = 120.0 / letters.length;

  // carica video
  v = createVideo("wormvideo.mp4");
  v.volume(0); // fondamentale
  v.attribute("muted", "");
  v.loop();
  v.hide();
}
function mousePressed() {
  v.loop();
}

function draw() {
  //blendMode(BLEND);
  background(255, 255, 255, 5);

  time += 0.1;

  //SFONDO
  push();
  let a = 0;
  let c1 = color(0, 0, 0);
  let c2 = color(255, 255, 255);
  translate(width / 2, height / 2);
  rotate(a);
  a += 0.02;
  setGradient(-width, -height, width * 2, height * 2, c1, c2);
  pop();

  //SERPENTONE DI CERCHI
  push();
  for (let i = 0; i < width; i++) {
    fill(127 + 127 * sin(i * 0.01 + time));

    let x = i * 1.2;
    let y = (height / 4) * sin(time + i * 0.03) + height / 2;
    let radius = 200 + 100 * sin(i * 0.015 + time);

    circle(x, y, radius);
  }
  push();
  v.loadPixels();

  for (let y = 0; y < v.height; y += 2) {
    for (let x = 0; x < v.width; x += 2) {
      let index = (x + y * v.width) * 4;

      let r = v.pixels[index];
      let g = v.pixels[index + 1];
      let b = v.pixels[index + 2];

      let bright = (r + g + b) / 3;
      if (bright > 40) {
        let tone = floor(map(bright, 255, 0, 0, letters.length - 1));

        let letter = letters.charAt(tone);
        text(letter, x * charW, y * charH);
      }
    }
  }
  pop();
}

function setGradient(x, y, w, h, c1, c2) {
  noFill();

  for (let i = y; i <= y + h; i++) {
    let inter = map(i, y, y + h, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(x, i, x + w, i);
  }
}
