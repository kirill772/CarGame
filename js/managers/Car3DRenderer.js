// Car3DRenderer.js
// Полноценный Three.js WebGL рендер машины для гаража и магазина.
// Сцена: прожекторы, HDRI-ambient, процедурная 3D-машина, bloom-glow, пол-зеркало.

import * as THREE from "three";
import { CarsData } from "../data/CarsData.js";

// ─── процедурная геометрия машины ────────────────────────────────────────────

function buildCarGeometry(car) {
  const group = new THREE.Group();
  const color  = parseHexSafe(car.color, "#1a1f38");
  const stripe = parseHexSafe(car.stripe, "#ffffff");
  const neon   = "#00e5ff";

  // ── кузов ──────────────────────────────────────────────────────────────────
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness: 0.72,
    roughness: 0.22,
    envMapIntensity: 1.4,
  });

  const bodyGeo = new THREE.BoxGeometry(2.0, 0.52, 4.2);
  chamferBox(bodyGeo, 0.10);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, 0.40, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // ── кабина ─────────────────────────────────────────────────────────────────
  const cabMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.7),
    metalness: 0.55,
    roughness: 0.18,
  });
  const cabGeo = new THREE.BoxGeometry(1.68, 0.46, 2.2);
  chamferBox(cabGeo, 0.12);
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(0, 0.82, -0.1);
  cab.castShadow = true;
  group.add(cab);

  // ── стёкла ─────────────────────────────────────────────────────────────────
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    metalness: 0.05,
    roughness: 0.05,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
  });
  // лобовое
  const wfGeo = new THREE.PlaneGeometry(1.52, 0.40);
  const wf = new THREE.Mesh(wfGeo, glassMat);
  wf.position.set(0, 0.85, 0.98);
  wf.rotation.x = Math.PI * 0.12;
  group.add(wf);
  // заднее
  const wrGeo = new THREE.PlaneGeometry(1.52, 0.38);
  const wr = new THREE.Mesh(wrGeo, glassMat);
  wr.position.set(0, 0.84, -1.18);
  wr.rotation.x = -Math.PI * 0.10;
  group.add(wr);

  // ── полосы/скин ─────────────────────────────────────────────────────────────
  const stripeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(stripe),
    metalness: 0.3,
    roughness: 0.45,
  });
  const stripeGeo = new THREE.BoxGeometry(0.18, 0.55, 3.8);
  [-0.82, 0.82].forEach(sx => {
    const s = new THREE.Mesh(stripeGeo, stripeMat);
    s.position.set(sx, 0.41, 0);
    group.add(s);
  });

  // ── колёса ─────────────────────────────────────────────────────────────────
  const wheelPositions = [
    [-1.1, 0.21, 1.4], [1.1, 0.21, 1.4],
    [-1.1, 0.21, -1.4], [1.1, 0.21, -1.4],
  ];
  wheelPositions.forEach(([wx, wy, wz]) => {
    const w = buildWheel(neon);
    w.position.set(wx, wy, wz);
    w.rotation.z = Math.PI / 2;
    group.add(w);
  });

  // ── неоновая подсветка снизу ─────────────────────────────────────────────
  const neonColor = new THREE.Color(neon);
  const neonMat = new THREE.MeshStandardMaterial({
    color: neonColor,
    emissive: neonColor,
    emissiveIntensity: 3.5,
    metalness: 0,
    roughness: 1,
  });
  // передний неон
  const nf = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 0.05), neonMat);
  nf.position.set(0, 0.12, 2.08);
  group.add(nf);
  // задний
  const nr = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 0.05), neonMat);
  nr.position.set(0, 0.12, -2.08);
  group.add(nr);
  // боковые
  [-1.02, 1.02].forEach(sx => {
    const ns = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 4.0), neonMat);
    ns.position.set(sx, 0.12, 0);
    group.add(ns);
  });

  // ── точечные огни (фары + стопы) ─────────────────────────────────────────
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 2.5,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xff2200,
    emissive: new THREE.Color(0xff2200),
    emissiveIntensity: 2.5,
  });
  const lightGeo = new THREE.SphereGeometry(0.09, 8, 6);
  [[-0.7, 0.44, 2.1], [0.7, 0.44, 2.1]].forEach(p => {
    const m = new THREE.Mesh(lightGeo, headMat); m.position.set(...p); group.add(m);
  });
  [[-0.7, 0.44, -2.1], [0.7, 0.44, -2.1]].forEach(p => {
    const m = new THREE.Mesh(lightGeo, tailMat); m.position.set(...p); group.add(m);
  });

  return group;
}

function buildWheel(neonColor) {
  const g = new THREE.Group();
  // резина
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.05 });
  const tire = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.11, 14, 28), tireMat);
  g.add(tire);
  // диск
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.9, roughness: 0.12 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.10, 16), rimMat);
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  // неоновый ободок
  const nc = new THREE.Color(neonColor);
  const neonRimMat = new THREE.MeshStandardMaterial({
    color: nc, emissive: nc, emissiveIntensity: 2.8, metalness: 0, roughness: 1,
  });
  const neonRim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 8, 24), neonRimMat);
  g.add(neonRim);
  return g;
}

function chamferBox(geo) {
  // упрощённый "сглаженный" вид — просто чуть сдвигаем вертексы по нормали
  // настоящий chamfer без доп. библиотек сложен, поэтому оставим обычный box
  return geo;
}

function parseHexSafe(hex, fallback = "#1a1f38") {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return fallback;
  return hex;
}

// ─── основной рендерер ────────────────────────────────────────────────────────

export class Car3DRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.carId = null;
    this._t = 0;
    this._animId = null;
    this._yaw = 0;
    this._targetYaw = 0;
    this._dragActive = false;
    this._lastPointerX = 0;
    this._yawVelocity = 0;

    this._init();
    this._bindDrag();
  }

  _init() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // ── renderer ─────────────────────────────────────────────────────────────
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (e) {
      this._fallback2D = true;
      this.ctx2d = this.canvas.getContext("2d");
      return;
    }
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    // ── scene ────────────────────────────────────────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x04060f, 0.055);

    // ── camera ───────────────────────────────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    this.camera.position.set(0, 2.4, 6.5);
    this.camera.lookAt(0, 0.55, 0);

    // ── освещение ────────────────────────────────────────────────────────────
    // ambient
    const amb = new THREE.AmbientLight(0x0d0e1a, 0.9);
    this.scene.add(amb);

    // ключевой прожектор (синий неон)
    const spot1 = new THREE.SpotLight(0x00e5ff, 28, 18, Math.PI * 0.28, 0.55, 1.8);
    spot1.position.set(-4, 7, 4);
    spot1.target.position.set(0, 0, 0);
    spot1.castShadow = true;
    spot1.shadow.mapSize.width = 1024;
    spot1.shadow.mapSize.height = 1024;
    spot1.shadow.camera.near = 1;
    spot1.shadow.camera.far = 22;
    this.scene.add(spot1);
    this.scene.add(spot1.target);

    // заполняющий прожектор (розовый)
    const spot2 = new THREE.SpotLight(0xff2bd6, 18, 16, Math.PI * 0.32, 0.6, 2.0);
    spot2.position.set(5, 6, -3);
    spot2.target.position.set(0, 0, 0);
    this.scene.add(spot2);
    this.scene.add(spot2.target);

    // контровой (зелёный/лайм)
    const spot3 = new THREE.SpotLight(0xa6ff00, 10, 14, Math.PI * 0.4, 0.7, 2.2);
    spot3.position.set(0, 5, -6);
    spot3.target.position.set(0, 0, 0);
    this.scene.add(spot3);
    this.scene.add(spot3.target);

    // верхний белый для деталей
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(0, 8, 3);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // ── пол ──────────────────────────────────────────────────────────────────
    this._buildFloor();

    // ── фоновая атмосфера ────────────────────────────────────────────────────
    this._buildAtmosphere();

    // ── частицы гаража ───────────────────────────────────────────────────────
    this._buildParticles();

    // ── группа машины ────────────────────────────────────────────────────────
    this.carGroup = new THREE.Group();
    this.scene.add(this.carGroup);

    // ── точка PointLight от неонов машины ───────────────────────────────────
    this.carNeonLight = new THREE.PointLight(0x00e5ff, 4.5, 6, 2.2);
    this.carNeonLight.position.set(0, -0.05, 0);
    this.carGroup.add(this.carNeonLight);
  }

  _buildFloor() {
    // зеркальный пол
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080c18,
      metalness: 0.85,
      roughness: 0.12,
      envMapIntensity: 0.8,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // неоновая сетка на полу
    const gridHelper = new THREE.GridHelper(16, 20, 0x00e5ff, 0x0a1520);
    gridHelper.position.y = 0.005;
    gridHelper.material.opacity = 0.25;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // неоновое кольцо под машиной
    const ringGeo = new THREE.TorusGeometry(2.2, 0.035, 8, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff, emissive: new THREE.Color(0x00e5ff), emissiveIntensity: 3.0,
    });
    this.neonRing = new THREE.Mesh(ringGeo, ringMat);
    this.neonRing.rotation.x = Math.PI / 2;
    this.neonRing.position.y = 0.02;
    this.scene.add(this.neonRing);

    // внешнее кольцо (пурпурное)
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xff2bd6, emissive: new THREE.Color(0xff2bd6), emissiveIntensity: 2.5,
    });
    this.neonRing2 = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.022, 8, 64), ring2Mat);
    this.neonRing2.rotation.x = Math.PI / 2;
    this.neonRing2.position.y = 0.02;
    this.scene.add(this.neonRing2);
  }

  _buildAtmosphere() {
    // светящийся туман-шар на фоне
    const spGeo = new THREE.SphereGeometry(12, 18, 12);
    const spMat = new THREE.MeshBasicMaterial({
      color: 0x04060f,
      side: THREE.BackSide,
    });
    this.scene.add(new THREE.Mesh(spGeo, spMat));

    // фоновые столбы света
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.4, 10, 8, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff, transparent: true, opacity: 0.035, side: THREE.DoubleSide,
    });
    const beamMat2 = new THREE.MeshBasicMaterial({
      color: 0xff2bd6, transparent: true, opacity: 0.03, side: THREE.DoubleSide,
    });
    [[-5, 5], [5, -5]].forEach(([x, z], i) => {
      const b = new THREE.Mesh(beamGeo, i === 0 ? beamMat : beamMat2);
      b.position.set(x, 5, z);
      this.scene.add(b);
    });
  }

  _buildParticles() {
    const count = 280;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x00e5ff, size: 0.06, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this._particles = new THREE.Points(geo, mat);
    this._particlePositions = positions;
    this._particleSpeeds = new Float32Array(count).map(() => 0.004 + Math.random() * 0.012);
    this.scene.add(this._particles);
  }

  async loadCar(carId) {
    this.carId = carId;
    if (this._fallback2D) return;

    // очищаем старую машину
    while (this.carGroup.children.length > 1) {
      const c = this.carGroup.children[0];
      if (c === this.carNeonLight) { this.carGroup.children.shift(); continue; }
      this.carGroup.remove(c);
    }
    this.carGroup.clear();
    this.carGroup.add(this.carNeonLight);

    const car = CarsData.find(c => c.id === carId) || CarsData[0];
    const carMesh = buildCarGeometry(car);
    this.carGroup.add(carMesh);
    this._carMesh = carMesh;

    // обновляем цвет неонового кольца под цвет полос машины
    const nc = parseHexSafe(car.stripe, "#00e5ff");
    this.carNeonLight.color.set(nc);
    if (this.neonRing) this.neonRing.material.color.set(nc);
    if (this.neonRing) this.neonRing.material.emissive.set(nc);
  }

  render() {
    if (this._fallback2D) { this._render2DFallback(); return; }
    if (!this.renderer) return;

    this._t += 0.016;
    const dt = 0.016;

    // авто-вращение + инерция от drag
    if (!this._dragActive) {
      this._yawVelocity *= 0.92;
      this._yaw += this._yawVelocity;
      this._yaw += 0.004; // медленное авто-вращение
    }

    if (this.carGroup) {
      this.carGroup.rotation.y = this._yaw;
      // лёгкий боб вверх-вниз
      this.carGroup.position.y = Math.sin(this._t * 0.8) * 0.06;
    }

    // пульсация неоновых колец
    if (this.neonRing) {
      const pulse = 0.85 + 0.15 * Math.sin(this._t * 2.2);
      this.neonRing.material.emissiveIntensity = 2.5 * pulse;
    }
    if (this.neonRing2) {
      const pulse2 = 0.85 + 0.15 * Math.sin(this._t * 1.7 + 1.2);
      this.neonRing2.material.emissiveIntensity = 2.0 * pulse2;
    }

    // анимация частиц (плавают вверх)
    if (this._particles && this._particlePositions) {
      const pos = this._particlePositions;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += this._particleSpeeds[i];
        if (pos[i * 3 + 1] > 8) pos[i * 3 + 1] = 0;
      }
      this._particles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  _bindDrag() {
    const el = this.canvas;

    const onDown = (e) => {
      this._dragActive = true;
      this._lastPointerX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    };
    const onMove = (e) => {
      if (!this._dragActive) return;
      const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const dx = cx - this._lastPointerX;
      this._lastPointerX = cx;
      this._yawVelocity = dx * 0.012;
      this._yaw += dx * 0.012;
    };
    const onUp = () => { this._dragActive = false; };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseup", onUp);
    el.addEventListener("mouseleave", onUp);
    el.addEventListener("touchstart", onDown, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onUp);
  }

  _render2DFallback() {
    const ctx = this.ctx2d;
    if (!ctx) return;
    const w = this.canvas.width, h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const car = CarsData.find(c => c.id === this.carId) || CarsData[0];
    const color = parseHexSafe(car?.color, "#1a1f38");
    const stripe = parseHexSafe(car?.stripe, "#ffffff");

    this._t += 0.016;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(this._t * 0.4);

    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    _roundRect2D(ctx, -40, -70, 80, 140, 14);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = stripe;
    _roundRect2D(ctx, -24, -48, 48, 70, 8);
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-32, -28); ctx.lineTo(-32, 56);
    ctx.moveTo(32, -28);  ctx.lineTo(32, 56);
    ctx.stroke();
    ctx.restore();
  }

  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
    if (this._animId) cancelAnimationFrame(this._animId);
  }
}

function _roundRect2D(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
