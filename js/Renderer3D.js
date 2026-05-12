// Renderer3D.js
// Полноценный Three.js 3D рендерер: дорога с бордюрами, вид от первого лица,
// процедурные машины, освещение, частицы, постпроцессинг.

import * as THREE from "three";
import { ROAD, TRACKS } from "./constants.js";

// ── Константы 3D ────────────────────────────────────────────────────────────
const ROAD_W      = 14;      // ширина асфальта (Three.js units)
const LANE_W      = ROAD_W / 3;
const SHOULDER_W  = 2.5;     // обочина
const GUARD_H     = 0.55;    // высота отбойника
const GUARD_W     = 0.22;
const SEGMENT_LEN = 6;       // длина одного сегмента дороги
const DRAW_DIST   = 220;     // сколько сегментов рисуем
const CAMERA_FOV  = 80;

// Позиция камеры относительно машины (вид от 1-го лица — внутри кабины)
const CAM_OFFSET   = new THREE.Vector3(0, 1.15, 0.22); // x=центр, y=высота, z=сзади немного

// ── Вспомогалки ─────────────────────────────────────────────────────────────
function hexColor(hex) {
  return new THREE.Color(hex);
}

function parseHex(hex, fallback = "#1a2040") {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return fallback;
  return hex;
}

// ── Основной класс ───────────────────────────────────────────────────────────
export class Renderer3D {
  constructor(canvas) {
    this.canvas   = canvas;
    this._w       = canvas.clientWidth  || 1280;
    this._h       = canvas.clientHeight || 720;
    this._t       = 0;
    this._theme   = "city";

    // Three.js
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this._w, this._h);
    this.renderer.shadowMap.enabled  = true;
    this.renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace   = THREE.SRGBColorSpace;
    this.renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, this._w / this._h, 0.1, 2000);

    // ── Объект-контейнер для камеры (двигается вместе с машиной)
    this.camRig = new THREE.Object3D();
    this.scene.add(this.camRig);
    this.camRig.add(this.camera);
    this.camera.position.copy(CAM_OFFSET);
    this.camera.lookAt(new THREE.Vector3(0, CAM_OFFSET.y - 0.05, -8));

    this._buildLights();
    this._buildSky();
    this._buildRoad();
    this._buildGuardrails();
    this._buildBuildings();
    this._buildPlayerCar();
    this._trafficMeshes = [];
    this._particles = this._buildExhaustParticles();

    // Resize
    window.addEventListener("resize", () => this._onResize());
    this._onResize();
  }

  // ── Освещение ───────────────────────────────────────────────────────────────
  _buildLights() {
    // Ambient
    this.ambientLight = new THREE.AmbientLight(0x0d0f1e, 1.2);
    this.scene.add(this.ambientLight);

    // Directional (луна)
    this.sunLight = new THREE.DirectionalLight(0x8899cc, 0.6);
    this.sunLight.position.set(30, 80, -40);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far  = 400;
    this.sunLight.shadow.camera.left   = -80;
    this.sunLight.shadow.camera.right  =  80;
    this.sunLight.shadow.camera.top    =  80;
    this.sunLight.shadow.camera.bottom = -80;
    this.scene.add(this.sunLight);

    // Фары машины (2 точечных) — двигаются с camRig
    this._headlight1 = new THREE.SpotLight(0xffffff, 18, 55, Math.PI * 0.18, 0.35, 1.5);
    this._headlight1.position.set(-0.55, 0.55, -2.5);
    this._headlight1.target.position.set(-0.55, -0.3, -30);
    this.camRig.add(this._headlight1);
    this.camRig.add(this._headlight1.target);

    this._headlight2 = new THREE.SpotLight(0xffffff, 18, 55, Math.PI * 0.18, 0.35, 1.5);
    this._headlight2.position.set(0.55, 0.55, -2.5);
    this._headlight2.target.position.set(0.55, -0.3, -30);
    this.camRig.add(this._headlight2);
    this.camRig.add(this._headlight2.target);

    // Неоновая подсветка снизу машины
    this._neonLight = new THREE.PointLight(0x00e5ff, 3.5, 5, 2);
    this._neonLight.position.set(0, -0.3, 0);
    this.camRig.add(this._neonLight);

    // Fog
    this.scene.fog = new THREE.FogExp2(0x03040e, 0.018);
  }

  // ── Небо ────────────────────────────────────────────────────────────────────
  _buildSky() {
    // Градиентное небо — большая сфера
    const skyGeo = new THREE.SphereGeometry(900, 16, 12);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor:    { value: new THREE.Color(0x020510) },
        bottomColor: { value: new THREE.Color(0x090a2d) },
        offset:      { value: 0.25 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y + offset;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
        }
      `,
    });
    this._skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this._skyMesh);

    // Звёзды
    const starCount = 1200;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      starPos[i * 3]     = 800 * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = 800 * Math.abs(Math.cos(phi)) + 50;
      starPos[i * 3 + 2] = 800 * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff, size: 1.8, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.scene.add(new THREE.Points(starGeo, starMat));
  }


  // ── Дорога ──────────────────────────────────────────────────────────────────
  _buildRoad() {
    this._roadSegments = [];  // { mesh, leftGuard, rightGuard, z }
    this._roadGroup = new THREE.Group();
    this.scene.add(this._roadGroup);

    // Материалы
    this._matAsphalt = new THREE.MeshStandardMaterial({
      color: 0x0a0c18, roughness: 0.95, metalness: 0.02,
    });
    this._matLine = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.8, metalness: 0,
      emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.12,
    });
    this._matLineDash = this._matLine.clone();

    this._matShoulder = new THREE.MeshStandardMaterial({
      color: 0x07090f, roughness: 1, metalness: 0,
    });

    this._matGuard = new THREE.MeshStandardMaterial({
      color: 0x1a1f38, roughness: 0.3, metalness: 0.85,
    });
    this._matGuardNeon = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: new THREE.Color(0x00e5ff),
      emissiveIntensity: 2.8,
      roughness: 1, metalness: 0,
    });

    // Создаём пул сегментов
    for (let i = 0; i < DRAW_DIST; i++) {
      const seg = this._createRoadSegment();
      seg.group.position.z = -i * SEGMENT_LEN;
      this._roadGroup.add(seg.group);
      this._roadSegments.push(seg);
    }
  }

  _createRoadSegment() {
    const group = new THREE.Group();

    // Асфальт
    const asphaltGeo = new THREE.PlaneGeometry(ROAD_W, SEGMENT_LEN);
    const asphalt = new THREE.Mesh(asphaltGeo, this._matAsphalt);
    asphalt.rotation.x = -Math.PI / 2;
    asphalt.receiveShadow = true;
    group.add(asphalt);

    // Обочины (левая и правая)
    for (const side of [-1, 1]) {
      const shGeo = new THREE.PlaneGeometry(SHOULDER_W, SEGMENT_LEN);
      const sh = new THREE.Mesh(shGeo, this._matShoulder);
      sh.rotation.x = -Math.PI / 2;
      sh.position.x = side * (ROAD_W / 2 + SHOULDER_W / 2);
      sh.receiveShadow = true;
      group.add(sh);
    }

    // Разметка — центральная сплошная
    const centerLineGeo = new THREE.PlaneGeometry(0.09, SEGMENT_LEN);
    const centerLine = new THREE.Mesh(centerLineGeo, this._matLine);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.005;
    group.add(centerLine);

    // Разметка — боковые пунктиры (2 линии)
    for (const lx of [-LANE_W / 2 - 0.045, LANE_W / 2 + 0.045]) {
      // нет, делаем пунктир из нескольких отрезков
      for (let di = 0; di < 3; di++) {
        const dashGeo = new THREE.PlaneGeometry(0.08, SEGMENT_LEN * 0.28);
        const dash = new THREE.Mesh(dashGeo, this._matLineDash);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(lx, 0.005, -SEGMENT_LEN * 0.18 + di * SEGMENT_LEN * 0.36);
        group.add(dash);
      }
    }

    // Крайние белые полосы
    for (const side of [-1, 1]) {
      const edgeGeo = new THREE.PlaneGeometry(0.14, SEGMENT_LEN);
      const edge = new THREE.Mesh(edgeGeo, this._matLine);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(side * (ROAD_W / 2 - 0.07), 0.005, 0);
      group.add(edge);
    }

    // Отбойники (guardrails) — металлические с неоновой полоской
    const guards = [];
    for (const side of [-1, 1]) {
      const gx = side * (ROAD_W / 2 + SHOULDER_W + GUARD_W / 2);

      const guardGeo = new THREE.BoxGeometry(GUARD_W, GUARD_H, SEGMENT_LEN);
      const guard = new THREE.Mesh(guardGeo, this._matGuard);
      guard.position.set(gx, GUARD_H / 2, 0);
      guard.castShadow = true;
      guard.receiveShadow = true;
      group.add(guard);

      // Неоновая полоска сверху отбойника
      const neonGeo = new THREE.BoxGeometry(GUARD_W * 0.3, 0.06, SEGMENT_LEN);
      const neon = new THREE.Mesh(neonGeo, this._matGuardNeon);
      neon.position.set(gx, GUARD_H + 0.035, 0);
      group.add(neon);

      guards.push({ guard, neon, side });
    }

    // Столбы освещения (каждые несколько сегментов — добавляем при нужде)
    return { group, guards };
  }

  _buildGuardrails() {
    // Фонарные столбы — создаём отдельно, размещаем по трассе
    this._poleGroup = new THREE.Group();
    this.scene.add(this._poleGroup);

    const poleMatSteel = new THREE.MeshStandardMaterial({
      color: 0x303548, roughness: 0.35, metalness: 0.9,
    });
    const poleLampMat = new THREE.MeshStandardMaterial({
      color: 0xfff0cc,
      emissive: new THREE.Color(0xfff0cc),
      emissiveIntensity: 3.5,
    });

    const POLE_SPACING = SEGMENT_LEN * 8;
    const POLE_COUNT   = Math.ceil((DRAW_DIST * SEGMENT_LEN) / POLE_SPACING) + 2;

    this._poles = [];
    for (let i = 0; i < POLE_COUNT; i++) {
      for (const side of [-1, 1]) {
        const px = side * (ROAD_W / 2 + SHOULDER_W + 1.2);

        const poleGeo = new THREE.CylinderGeometry(0.07, 0.09, 7, 8);
        const pole = new THREE.Mesh(poleGeo, poleMatSteel);
        pole.position.set(px, 3.5, 0);
        pole.castShadow = true;

        // Горизонтальная перекладина
        const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6);
        const arm = new THREE.Mesh(armGeo, poleMatSteel);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(side * (-0.7), 7, 0);
        pole.add(arm);

        // Лампа
        const lampGeo = new THREE.SphereGeometry(0.22, 8, 6);
        const lamp = new THREE.Mesh(lampGeo, poleLampMat);
        lamp.position.set(side * (-1.4), 7, 0);
        pole.add(lamp);

        // PointLight у каждого фонаря
        const pl = new THREE.PointLight(0xffe8a0, 2.5, 22, 2);
        pl.position.copy(lamp.position);
        pole.add(pl);

        this._poleGroup.add(pole);
        this._poles.push({ mesh: pole, baseZ: -i * POLE_SPACING });
      }
    }
  }

  // ── Фоновые здания ──────────────────────────────────────────────────────────
  _buildBuildings() {
    this._buildingGroup = new THREE.Group();
    this.scene.add(this._buildingGroup);
    this._buildings = [];

    const NEONS  = [0x00e5ff, 0xff2bd6, 0xa6ff00, 0xffd000, 0x19ff9b, 0xff6b00];
    const COLORS = [0x080b18, 0x07091a, 0x0a0d20, 0x060810];

    const count = 80;
    for (let i = 0; i < count; i++) {
      const w = 4 + Math.random() * 14;
      const h = 10 + Math.random() * 55;
      const d = 3 + Math.random() * 8;

      const bGeo = new THREE.BoxGeometry(w, h, d);
      const bMat = new THREE.MeshStandardMaterial({
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        roughness: 0.9, metalness: 0.1,
      });
      const bld = new THREE.Mesh(bGeo, bMat);

      const side = Math.random() < 0.5 ? -1 : 1;
      const bx = side * (ROAD_W / 2 + SHOULDER_W + GUARD_W + 2 + Math.random() * 30 + w / 2);
      const bz = -(Math.random() * DRAW_DIST * SEGMENT_LEN);

      bld.position.set(bx, h / 2, bz);
      bld.castShadow = true;
      bld.receiveShadow = true;
      this._buildingGroup.add(bld);

      // Случайные неоновые окна — как эмиссивные полоски
      const neonColor = NEONS[Math.floor(Math.random() * NEONS.length)];
      const winCount = 2 + Math.floor(Math.random() * 4);
      for (let wi = 0; wi < winCount; wi++) {
        const winGeo = new THREE.PlaneGeometry(w * 0.7, 0.25);
        const winMat = new THREE.MeshStandardMaterial({
          color: neonColor,
          emissive: new THREE.Color(neonColor),
          emissiveIntensity: 2.0,
          side: THREE.FrontSide,
        });
        const win = new THREE.Mesh(winGeo, winMat);
        const wy = -h / 2 + (wi + 1) * (h / (winCount + 1));
        win.position.set(0, wy, d / 2 + 0.01);
        bld.add(win);
      }

      this._buildings.push({ mesh: bld, baseZ: bz });
    }
  }


  // ── Машина игрока (3D) ──────────────────────────────────────────────────────
  _buildPlayerCar() {
    this._playerCarGroup = new THREE.Group();
    this.camRig.add(this._playerCarGroup);

    // Кузов
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xff4d4d, metalness: 0.72, roughness: 0.22,
    });
    const bodyGeo = new THREE.BoxGeometry(2.0, 0.52, 4.2);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.4, -1.2);
    body.castShadow = true;
    this._playerCarGroup.add(body);
    this._carBodyMesh = body;

    // Кабина
    const cabMat = bodyMat.clone();
    cabMat.color.set(0xaa2222);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.44, 2.1), cabMat);
    cab.position.set(0, 0.82, -1.0);
    cab.castShadow = true;
    this._playerCarGroup.add(cab);

    // Стёкла
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff, metalness: 0.05, roughness: 0.05,
      transparent: true, opacity: 0.35, side: THREE.DoubleSide,
    });
    const wfGeo = new THREE.PlaneGeometry(1.5, 0.42);
    const wf = new THREE.Mesh(wfGeo, glassMat);
    wf.rotation.x = Math.PI * 0.12;
    wf.position.set(0, 0.85, 0.05);
    this._playerCarGroup.add(wf);

    // Неоновые линии по бокам
    const neonMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: new THREE.Color(0x00e5ff),
      emissiveIntensity: 3.5,
    });
    for (const sx of [-1.02, 1.02]) {
      const sideNeon = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 4.0), neonMat);
      sideNeon.position.set(sx, 0.12, -1.2);
      this._playerCarGroup.add(sideNeon);
    }
    this._neonMat = neonMat;

    // Колёса
    const wheelPos = [
      [-1.1, 0.21, 0.3], [1.1, 0.21, 0.3],
      [-1.1, 0.21, -2.5], [1.1, 0.21, -2.5],
    ];
    this._wheels = [];
    const tireMat  = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.9 });
    const rimMat   = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.9, roughness: 0.12 });
    const neonRimMat = neonMat.clone();

    for (const [wx, wy, wz] of wheelPos) {
      const wg = new THREE.Group();
      wg.position.set(wx, wy, wz);
      wg.rotation.z = Math.PI / 2;

      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.11, 12, 24), tireMat);
      const rim  = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.10, 14), rimMat);
      rim.rotation.x = Math.PI / 2;
      const neonRim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 24), neonRimMat);

      wg.add(tire, rim, neonRim);
      this._playerCarGroup.add(wg);
      this._wheels.push(wg);
    }

    // Фары
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: new THREE.Color(0xffffff), emissiveIntensity: 2.5,
    });
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xff2200, emissive: new THREE.Color(0xff2200), emissiveIntensity: 2.5,
    });
    for (const [hx, hz, mat] of [
      [-0.7, 0.9, headMat], [0.7, 0.9, headMat],
      [-0.7, -2.7, tailMat], [0.7, -2.7, tailMat],
    ]) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 6), mat);
      m.position.set(hx, 0.44, hz);
      this._playerCarGroup.add(m);
    }

    // Пока скрываем тело машины (вид от 1-го лица)
    this._playerCarGroup.visible = false;
  }

  // ── Выхлопные частицы ───────────────────────────────────────────────────────
  _buildExhaustParticles() {
    const count = 180;
    const positions = new Float32Array(count * 3);
    const alphas    = new Float32Array(count);
    const vels      = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = 0.1;
      positions[i * 3 + 2] = 2.5 + Math.random() * 0.5;
      alphas[i] = 0;
      vels.push({ vx: (Math.random()-0.5)*0.05, vy: 0.01+Math.random()*0.04, vz: 0.03+Math.random()*0.12, life: Math.random() });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x00e5ff, size: 0.22, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    this.camRig.add(pts);

    return { pts, positions, vels, count };
  }

  // ── Трафик-машины ───────────────────────────────────────────────────────────
  _getOrCreateTrafficMesh(index, carColor, neonColor) {
    if (this._trafficMeshes[index]) return this._trafficMeshes[index];

    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(carColor || 0x1a2040),
      metalness: 0.65, roughness: 0.28,
    });
    const neonC = new THREE.Color(neonColor || 0xff2bd6);
    const neonMat2 = new THREE.MeshStandardMaterial({
      color: neonC, emissive: neonC, emissiveIntensity: 3.0,
    });

    const group = new THREE.Group();
    const body  = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.50, 3.9), bodyMat);
    body.position.y = 0.4;
    body.castShadow = true;
    group.add(body);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 1.95), bodyMat);
    cab.position.set(0, 0.80, 0.1);
    cab.castShadow = true;
    group.add(cab);

    for (const sx of [-0.98, 0.98]) {
      const sn = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 3.7), neonMat2);
      sn.position.set(sx, 0.12, 0);
      group.add(sn);
    }

    // Колёса
    const tireMat  = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.9 });
    for (const [wx, wy, wz] of [[-1.0, 0.19, 1.1],[1.0, 0.19, 1.1],[-1.0, 0.19, -1.1],[1.0, 0.19, -1.1]]) {
      const wg = new THREE.Group();
      wg.position.set(wx, wy, wz);
      wg.rotation.z = Math.PI / 2;
      wg.add(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.10, 8, 18), tireMat));
      group.add(wg);
    }

    this.scene.add(group);
    this._trafficMeshes[index] = group;
    return group;
  }

  // ── Обновление темы (цвета неона, тумана и т.д.) ────────────────────────────
  setTheme(theme) {
    if (this._theme === theme) return;
    this._theme = theme;

    const themes = {
      city:     { fog: 0x03040e, fogDensity: 0.018, neon: 0x00e5ff, sky: [0x020510, 0x090a2d] },
      mountain: { fog: 0x080c12, fogDensity: 0.012, neon: 0xa6ff00, sky: [0x050717, 0x10143a] },
      tokyo:    { fog: 0x0a0320, fogDensity: 0.022, neon: 0xff2bd6, sky: [0x050612, 0x14083a] },
      desert:   { fog: 0x180808, fogDensity: 0.010, neon: 0xffd000, sky: [0x12060a, 0x2a0d10] },
      highway:  { fog: 0x02030a, fogDensity: 0.015, neon: 0x00e5ff, sky: [0x02030a, 0x0a0b1b] },
      megacity: { fog: 0x030311, fogDensity: 0.020, neon: 0x00e5ff, sky: [0x030311, 0x13093a] },
    };
    const cfg = themes[theme] || themes.city;

    this.scene.fog.color.set(cfg.fog);
    this.scene.fog.density = cfg.fogDensity;
    this._skyMesh.material.uniforms.topColor.value.set(cfg.sky[0]);
    this._skyMesh.material.uniforms.bottomColor.value.set(cfg.sky[1]);

    const nc = new THREE.Color(cfg.neon);
    this._matGuardNeon.color.copy(nc);
    this._matGuardNeon.emissive.copy(nc);
    this._neonLight.color.copy(nc);
    if (this._neonMat) {
      this._neonMat.color.copy(nc);
      this._neonMat.emissive.copy(nc);
    }
  }

  // ── Обновить цвет/скин машины игрока ───────────────────────────────────────
  setPlayerCarSkin(bodyHex, neonHex) {
    if (this._carBodyMesh) {
      this._carBodyMesh.material.color.set(parseHex(bodyHex, "#ff4d4d"));
    }
    if (this._neonMat) {
      const nc = new THREE.Color(parseHex(neonHex, "#00e5ff"));
      this._neonMat.color.copy(nc);
      this._neonMat.emissive.copy(nc);
      this._neonLight.color.copy(nc);
    }
  }


  // ── Главный рендер-кадр ─────────────────────────────────────────────────────
  /**
   * Вызывается каждый кадр из Game.js
   * @param {object} state  — {
   *   playerX,      // -1..1 нормализованная позиция по ширине дороги
   *   playerSpeed,  // px/s (game units)
   *   playerMaxSpeed,
   *   playerZ,      // накопленная Z позиция игрока (game units)
   *   steer,        // -1..1
   *   driftHeat,    // 0..1
   *   nitroActive,  // bool
   *   health01,     // 0..1
   *   cameraZ,      // game cameraZ
   *   track,        // Track instance
   *   trafficCars,  // [{active,x,z,neon,color}...]
   *   dt,
   * }
   */
  render(state) {
    const {
      playerX = 0, playerSpeed = 0, playerMaxSpeed = 980,
      steer = 0, driftHeat = 0, nitroActive = false,
      cameraZ = 0, track, trafficCars = [], dt = 0.016,
    } = state;

    this._t += dt;

    // ── Позиция CamRig (следует за игроком) ──────────────────────────────────
    // Game units → Three.js units: делим на ~100 (980 px/s ≈ 9.8 Three units/s)
    const SCALE = 1 / 100;

    // playerX в game units (±195 примерно) → ±ROAD_W/2
    const roadHalfW = (3 * 130) / 2;  // ROAD.lanes * ROAD.laneWidth / 2
    const tx3d = (playerX / roadHalfW) * (ROAD_W / 2) * 0.95;

    // Лёгкий боковой крен при повороте
    const rollAngle = steer * 0.032 + driftHeat * 0.055;
    this.camRig.rotation.z = rollAngle;

    // Bobbing при езде
    const speedNorm = playerMaxSpeed > 0 ? playerSpeed / playerMaxSpeed : 0;
    const bob = speedNorm > 0.05 ? Math.sin(this._t * 18 * speedNorm) * 0.018 * speedNorm : 0;
    this.camRig.position.set(tx3d, bob, 0);

    // ── Обновить дорогу ──────────────────────────────────────────────────────
    const camZ3d = cameraZ * SCALE;
    this._updateRoad(camZ3d, track);

    // ── Фонарные столбы ──────────────────────────────────────────────────────
    this._updatePoles(camZ3d, track);

    // ── Здания ───────────────────────────────────────────────────────────────
    this._updateBuildings(camZ3d);

    // ── Трафик ───────────────────────────────────────────────────────────────
    this._updateTraffic(camZ3d, trafficCars, roadHalfW, track);

    // ── Выхлоп ───────────────────────────────────────────────────────────────
    this._updateExhaust(speedNorm, nitroActive, dt);

    // ── Фары — усиливаем при нитро ───────────────────────────────────────────
    const headPow = 18 + (nitroActive ? 12 : 0);
    this._headlight1.intensity = headPow;
    this._headlight2.intensity = headPow;
    this._neonLight.intensity  = 3.5 + (nitroActive ? 2.5 : 0);

    // ── Рендер ───────────────────────────────────────────────────────────────
    this.renderer.render(this.scene, this.camera);
  }

  // ── Обновить позиции сегментов дороги ───────────────────────────────────────
  _updateRoad(camZ3d, track) {
    const segCount = this._roadSegments.length;
    const firstSeg = Math.floor(camZ3d / SEGMENT_LEN);

    for (let i = 0; i < segCount; i++) {
      const segIdx = firstSeg + i;
      const segZ   = -segIdx * SEGMENT_LEN;   // мировая Z сегмента

      const seg  = this._roadSegments[i % segCount];
      const gameZ = segIdx * SEGMENT_LEN * 100; // обратно в game units

      // Кривизна трассы
      const curve  = track ? track.sampleCurve(gameZ) : 0;
      const prevCurve = track ? track.sampleCurve(gameZ - SEGMENT_LEN * 100) : 0;

      // Накопленный сдвиг X от кривизны
      let accX = 0;
      for (let si = firstSeg; si < segIdx; si++) {
        const sc = track ? track.sampleCurve(si * SEGMENT_LEN * 100) : 0;
        accX += sc * SEGMENT_LEN * 0.12;
      }

      seg.group.position.set(accX, 0, segZ);

      // Небольшой поворот по Y для иллюзии плавного поворота
      seg.group.rotation.y = (curve - prevCurve) * 0.15;

      // Пульсация неона на отбойнике
      const pulse = 0.85 + 0.15 * Math.sin(this._t * 2.5 + segIdx * 0.4);
      for (const g of seg.guards) {
        g.neon.material.emissiveIntensity = 2.8 * pulse;
      }
    }
  }

  // ── Обновить столбы освещения ────────────────────────────────────────────────
  _updatePoles(camZ3d, track) {
    const POLE_SPACING = SEGMENT_LEN * 8;
    for (let pi = 0; pi < this._poles.length; pi++) {
      const poleInfo = this._poles[pi];
      const sideIdx  = pi % 2;
      const poleNum  = Math.floor(pi / 2);
      const baseZ    = poleNum * POLE_SPACING;
      const nearestBaseZ = Math.floor(camZ3d / (POLE_SPACING * (this._poles.length / 2))) * (POLE_SPACING * (this._poles.length / 2));
      const pz = -(nearestBaseZ + baseZ - camZ3d * 0); // статично, двигаем через camZ

      // Переставляем столбы вперёд когда они уходят за камеру
      const worldPz = poleInfo.baseZ - camZ3d * 0;
      // Двигаем группу столба чтобы он был всегда в нужной позиции
      const totalSpan = this._poles.length / 2 * POLE_SPACING;
      let adjustedZ = poleInfo.baseZ;
      // Cyclic repositioning
      while (adjustedZ > -camZ3d + SEGMENT_LEN * 2) {
        poleInfo.baseZ -= totalSpan;
        adjustedZ = poleInfo.baseZ;
      }
      while (adjustedZ < -camZ3d - DRAW_DIST * SEGMENT_LEN - POLE_SPACING) {
        poleInfo.baseZ += totalSpan;
        adjustedZ = poleInfo.baseZ;
      }

      const gameZ = -poleInfo.baseZ * 100;
      const curve = track ? track.sampleCurve(Math.max(0, gameZ)) : 0;
      let accX = 0;
      const segIdx = Math.floor(-poleInfo.baseZ / SEGMENT_LEN);
      for (let si = Math.floor(camZ3d / SEGMENT_LEN); si < segIdx; si++) {
        const sc = track ? track.sampleCurve(si * SEGMENT_LEN * 100) : 0;
        accX += sc * SEGMENT_LEN * 0.12;
      }
      const side = sideIdx === 0 ? -1 : 1;
      const px = accX + side * (ROAD_W / 2 + SHOULDER_W + 1.2);
      poleInfo.mesh.position.set(px, 0, poleInfo.baseZ);
    }
  }

  // ── Здания ───────────────────────────────────────────────────────────────────
  _updateBuildings(camZ3d) {
    for (const b of this._buildings) {
      // Зациклить здания
      const span = DRAW_DIST * SEGMENT_LEN;
      while (b.mesh.position.z > -camZ3d + 50) {
        b.mesh.position.z -= span;
      }
      while (b.mesh.position.z < -camZ3d - span) {
        b.mesh.position.z += span;
      }
    }
  }

  // ── Трафик ───────────────────────────────────────────────────────────────────
  _updateTraffic(camZ3d, trafficCars, roadHalfW, track) {
    for (let i = 0; i < trafficCars.length; i++) {
      const tc = trafficCars[i];
      if (!tc.active) {
        if (this._trafficMeshes[i]) this._trafficMeshes[i].visible = false;
        continue;
      }

      const mesh = this._getOrCreateTrafficMesh(i, tc.color || "#1a2040", tc.neon || "#ff2bd6");
      const SCALE = 1 / 100;
      const tzd = -(tc.z * SCALE - camZ3d);  // relative to camera
      if (tzd > -SEGMENT_LEN || tzd < -(DRAW_DIST * SEGMENT_LEN)) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;

      const tx3d = (tc.x / roadHalfW) * (ROAD_W / 2) * 0.95;
      const gameZ = tc.z;
      let accX = 0;
      const segFirst  = Math.floor(camZ3d / SEGMENT_LEN);
      const segTarget = Math.floor(tc.z * SCALE / SEGMENT_LEN);
      for (let si = segFirst; si < segTarget; si++) {
        const sc = track ? track.sampleCurve(si * SEGMENT_LEN * 100) : 0;
        accX += sc * SEGMENT_LEN * 0.12;
      }

      mesh.position.set(tx3d + accX, 0, tzd);
    }
  }

  // ── Выхлоп ───────────────────────────────────────────────────────────────────
  _updateExhaust(speedNorm, nitroActive, dt) {
    const { pts, positions, vels, count } = this._particles;
    for (let i = 0; i < count; i++) {
      vels[i].life += dt * (1.5 + speedNorm * 3 + (nitroActive ? 4 : 0));
      if (vels[i].life > 1) {
        // Respawn
        vels[i].life = 0;
        positions[i*3]   = (Math.random()-0.5) * 0.4;
        positions[i*3+1] = 0.1;
        positions[i*3+2] = 2.4 + Math.random() * 0.3;
      }
      const t = vels[i].life;
      positions[i*3]   += vels[i].vx * dt * 60;
      positions[i*3+1] += vels[i].vy * dt * 60;
      positions[i*3+2] += vels[i].vz * dt * 60;
    }
    pts.geometry.attributes.position.needsUpdate = true;
    pts.material.opacity = 0.25 + speedNorm * 0.4 + (nitroActive ? 0.3 : 0);
    pts.material.color.set(nitroActive ? 0xff6600 : 0x00e5ff);
    pts.visible = speedNorm > 0.05;
  }

  // ── Resize ────────────────────────────────────────────────────────────────────
  _onResize() {
    const w = this.canvas.clientWidth  || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  // ── Освободить ресурсы ────────────────────────────────────────────────────────
  dispose() {
    this.renderer.dispose();
  }
}
