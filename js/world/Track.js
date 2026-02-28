// Track.js
// Трасса — генератор сегментов дороги + темы оформления.

import { ROAD, TRACKS } from "../constants.js";
import { clamp, lerp, rand, smoothstep } from "../utils.js";
import { RoadSegment } from "./RoadSegment.js";

function makeCurvePattern() {
  const parts = [];
  const count = 10 + Math.floor(Math.random() * 6);
  let last = 0;
  for (let i = 0; i < count; i++) {
    const target = clamp(last + rand(-0.9, 0.9), -1, 1);
    const len = 24 + Math.floor(Math.random() * 34);
    parts.push({ target, len });
    last = target * 0.55;
  }
  return parts;
}

export class Track {
  constructor(trackId = TRACKS[0].id) {
    this.setTrack(trackId);
  }

  setTrack(trackId) {
    const t = TRACKS.find(x => x.id === trackId) || TRACKS[0];
    this.id = t.id;
    this.name = t.name;
    this.theme = t.theme;

    this.segments = [];
    this.lengthZ = 0;

    const km = rand(4.5, 6.5);
    const total = Math.floor((km * 1000) / ROAD.segmentLength);

    const pattern = makeCurvePattern();
    let pIndex = 0;
    let pT = 0;
    let prevCurve = 0;

    for (let i = 0; i < total; i++) {
      const seg = new RoadSegment(i * ROAD.segmentLength);
      seg.theme = this.theme;

      const part = pattern[pIndex];
      pT += 1;
      const t01 = smoothstep(pT / part.len);
      seg.curve = lerp(prevCurve, part.target, t01);

      if (pT >= part.len) {
        prevCurve = part.target;
        pIndex = (pIndex + 1) % pattern.length;
        pT = 0;
      }

      seg.elevation = Math.sin(i * 0.03) * 0.35;
      this.segments.push(seg);
    }

    this.lengthZ = total * ROAD.segmentLength;
    this.palette = this._makeThemePalette();
  }

  _makeThemePalette() {
    const base = {
      city: { sky0: "#04051a", sky1: "#090a2d", glow: "#00e5ff", accent: "#ff2bd6" },
      mountain: { sky0: "#050717", sky1: "#10143a", glow: "#a6ff00", accent: "#00e5ff" },
      tokyo: { sky0: "#050612", sky1: "#14083a", glow: "#ff2bd6", accent: "#00e5ff" },
      desert: { sky0: "#12060a", sky1: "#2a0d10", glow: "#ffd000", accent: "#ff2bd6" },
      highway: { sky0: "#02030a", sky1: "#0a0b1b", glow: "#00e5ff", accent: "#a6ff00" },
      megacity: { sky0: "#030311", sky1: "#13093a", glow: "#00e5ff", accent: "#ff2bd6" },
    };
    return base[this.theme] || base.city;
  }

  getSegmentAtZ(z) {
    let zz = z % this.lengthZ;
    if (zz < 0) zz += this.lengthZ;
    const idx = Math.floor(zz / ROAD.segmentLength);
    return this.segments[idx] || this.segments[0];
  }

  sampleCurve(z) {
    const seg0 = this.getSegmentAtZ(z);
    const z0 = Math.floor((z % this.lengthZ) / ROAD.segmentLength) * ROAD.segmentLength;
    const t = ((z % this.lengthZ) - z0) / ROAD.segmentLength;
    const seg1 = this.getSegmentAtZ(z0 + ROAD.segmentLength);
    return lerp(seg0.curve, seg1.curve, t);
  }
}
