function mod2pi(theta) {
  return theta - 2.0 * PI * floor(theta / 2.0 / PI);
}
function pi_2_pi(angle) {
  while (angle >= PI) angle -= TWO_PI;
  while (angle <= -PI) angle += TWO_PI;
  return angle;
}
function LSL(alpha, beta, d) {
  let sa = sin(alpha),
    sb = sin(beta),
    ca = cos(alpha),
    cb = cos(beta),
    c_ab = cos(alpha - beta);
  let p_sq = 2 + d * d - 2 * c_ab + 2 * d * (sa - sb);
  if (p_sq < 0) return [null, null, null, ["L", "S", "L"]];
  let tmp1 = atan2(cb - ca, d + sa - sb);
  return [
    mod2pi(-alpha + tmp1),
    sqrt(p_sq),
    mod2pi(beta - tmp1),
    ["L", "S", "L"],
  ];
}
function RSR(alpha, beta, d) {
  let sa = sin(alpha),
    sb = sin(beta),
    ca = cos(alpha),
    cb = cos(beta),
    c_ab = cos(alpha - beta);
  let p_sq = 2 + d * d - 2 * c_ab + 2 * d * (sb - sa);
  if (p_sq < 0) return [null, null, null, ["R", "S", "R"]];
  let tmp1 = atan2(ca - cb, d - sa + sb);
  return [
    mod2pi(alpha - tmp1),
    sqrt(p_sq),
    mod2pi(-beta + tmp1),
    ["R", "S", "R"],
  ];
}
function LSR(alpha, beta, d) {
  let sa = sin(alpha),
    sb = sin(beta),
    ca = cos(alpha),
    cb = cos(beta),
    c_ab = cos(alpha - beta);
  let p_sq = -2 + d * d + 2 * c_ab + 2 * d * (sa + sb);
  if (p_sq < 0) return [null, null, null, ["L", "S", "R"]];
  let p = sqrt(p_sq),
    tmp2 = atan2(-ca - cb, d + sa + sb) - atan2(-2, p);
  return [
    mod2pi(-alpha + tmp2),
    p,
    mod2pi(-mod2pi(beta) + tmp2),
    ["L", "S", "R"],
  ];
}
function RSL(alpha, beta, d) {
  let sa = sin(alpha),
    sb = sin(beta),
    ca = cos(alpha),
    cb = cos(beta),
    c_ab = cos(alpha - beta);
  let p_sq = d * d - 2 + 2 * c_ab - 2 * d * (sa + sb);
  if (p_sq < 0) return [null, null, null, ["R", "S", "L"]];
  let p = sqrt(p_sq),
    tmp2 = atan2(ca + cb, d - sa - sb) - atan2(2, p);
  return [mod2pi(alpha - tmp2), p, mod2pi(beta - tmp2), ["R", "S", "L"]];
}
function RLR(alpha, beta, d) {
  let sa = sin(alpha),
    sb = sin(beta),
    ca = cos(alpha),
    cb = cos(beta),
    c_ab = cos(alpha - beta);
  let tmp = (6 - d * d + 2 * c_ab + 2 * d * (sa - sb)) / 8;
  if (abs(tmp) > 1) return [null, null, null, ["R", "L", "R"]];
  let p = mod2pi(2 * PI - acos(tmp));
  let t = mod2pi(alpha - atan2(ca - cb, d - sa + sb) + mod2pi(p / 2));
  return [t, p, mod2pi(alpha - beta - t + mod2pi(p)), ["R", "L", "R"]];
}
function LRL(alpha, beta, d) {
  let sa = sin(alpha),
    sb = sin(beta),
    ca = cos(alpha),
    cb = cos(beta),
    c_ab = cos(alpha - beta);
  let tmp = (6 - d * d + 2 * c_ab + 2 * d * (-sa + sb)) / 8;
  if (abs(tmp) > 1) return [null, null, null, ["L", "R", "L"]];
  let p = mod2pi(2 * PI - acos(tmp));
  let t = mod2pi(-alpha - atan2(ca - cb, d + sa - sb) + p / 2);
  return [t, p, mod2pi(mod2pi(beta) - alpha - t + mod2pi(p)), ["L", "R", "L"]];
}

// generate_course ora traccia anche arcStartIndices:
// l'indice esatto nel path dove inizia ognuno dei 3 archi.
function generate_course(length, mode, c) {
  let px = [0],
    py = [0],
    pyaw = [0];
  let arcStartIndices = [0]; // arco 0 inizia sempre all'indice 0

  for (let i = 0; i < length.length; i++) {
    let m = mode[i],
      l = length[i],
      pd = 0;
    let d = m === "S" ? 1 / c : radians(0.5);

    while (pd < abs(l - d)) {
      px.push(px.at(-1) + d * c * cos(pyaw.at(-1)));
      py.push(py.at(-1) + d * c * sin(pyaw.at(-1)));
      pyaw.push(pyaw.at(-1) + (m === "L" ? d : m === "R" ? -d : 0));
      pd += d;
    }
    d = l - pd;
    px.push(px.at(-1) + d * c * cos(pyaw.at(-1)));
    py.push(py.at(-1) + d * c * sin(pyaw.at(-1)));
    pyaw.push(pyaw.at(-1) + (m === "L" ? d : m === "R" ? -d : 0));

    // Il prossimo arco inizia all'indice corrente (se non è l'ultimo)
    if (i < length.length - 1) {
      arcStartIndices.push(px.length - 1);
    }
  }

  return [px, py, pyaw, arcStartIndices];
}

function dubins_path_planning_from_origin(ex, ey, eyaw, c) {
  let e = sqrt(ex * ex + ey * ey),
    d = e / c;
  let theta = mod2pi(atan2(ey, ex));
  let alpha = mod2pi(-theta),
    beta = mod2pi(eyaw - theta);
  let best = { cost: Infinity, t: 0, p: 0, q: 0, mode: ["L", "S", "L"] };
  for (let fn of [LSL, RSR, LSR, RSL, RLR, LRL]) {
    let [t, p, q, mode] = fn(alpha, beta, d);
    if (t == null) continue;
    let cost = abs(t) + abs(p) + abs(q);
    if (cost < best.cost) best = { cost, t, p, q, mode };
  }
  let [px, py, pyaw, arcStartIndices] = generate_course(
    [best.t, best.p, best.q],
    best.mode,
    c,
  );
  return [px, py, pyaw, best.mode, best.cost, arcStartIndices];
}

function dubins_path_planning(sx, sy, syaw, ex, ey, eyaw, c) {
  let dx = ex - sx,
    dy = ey - sy;
  let lex = cos(syaw) * dx + sin(syaw) * dy;
  let ley = -sin(syaw) * dx + cos(syaw) * dy;
  let [lpx, lpy, lpyaw, mode, clen, arcStartIndices] =
    dubins_path_planning_from_origin(lex, ley, eyaw - syaw, c);

  let px = [],
    py = [],
    pyaw = [];
  for (let i = 0; i < lpx.length; i++) {
    px.push(cos(-syaw) * lpx[i] + sin(-syaw) * lpy[i] + sx);
    py.push(-sin(-syaw) * lpx[i] + cos(-syaw) * lpy[i] + sy);
  }
  for (let y of lpyaw) pyaw.push(pi_2_pi(y + syaw));

  // arcStartIndices non cambia: sono indici nel path, non coordinate
  return [px, py, pyaw, mode, clen, arcStartIndices];
}

function generateNewSegment() {
  if (currentSegment) {
    let arcs = currentSegment.arcStartIndices;
    let mode = currentSegment.mode;
    let currentArc = 0;
    for (let i = 1; i < arcs.length; i++) {
      if (drawIndex >= arcs[i]) currentArc = i;
    }
    if (mode[currentArc] !== "S") {
      let idx = arcs[currentArc];
      let yaw0 = currentSegment.pyaw[idx];
      let perpAngle =
        mode[currentArc] === "L" ? yaw0 + HALF_PI : yaw0 - HALF_PI;
      fadingCircles.push({
        cx: currentSegment.px[idx] + cos(perpAngle) * curvature,
        cy: currentSegment.py[idx] + sin(perpAngle) * curvature,
        radius: curvature,
        alpha: 0.3,
      });
    }
  }

  let offset = width / 5;
  let newPoint = {
    x: random(offset, width - offset),
    y: random(offset, height - offset),
    yaw: random(TWO_PI),
  };
  let arr = dubins_path_planning(
    currentPoint.x,
    currentPoint.y,
    currentPoint.yaw,
    newPoint.x,
    newPoint.y,
    newPoint.yaw,
    curvature,
  );
  currentSegment = {
    px: arr[0],
    py: arr[1],
    pyaw: arr[2],
    mode: arr[3],
    arcStartIndices: arr[5],
  };
  drawIndex = 0;
  // Lo yaw di partenza del prossimo segmento è l'ultimo yaw di questo path,
  // non newPoint.yaw — così la curva è sempre continua e smooth
  currentPoint = {
    x: newPoint.x,
    y: newPoint.y,
    yaw: arr[2][arr[2].length - 1],
  };
  drawIndex = 0;
  lastArc = -1;
}
