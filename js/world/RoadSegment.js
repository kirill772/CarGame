// RoadSegment.js
// Сегмент дороги: хранит “кривизну” (смещение центра) и визуальные параметры.

export class RoadSegment {
  constructor(z) {
    this.z = z;
    this.curve = 0;
    this.elevation = 0;
    this.theme = "city";
  }
}
