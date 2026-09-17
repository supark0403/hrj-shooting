/* HRJ SHOOTING - 스테이지/웨이브 정의 (5개 스테이지, 난이도 상승) */
(function (global) {
  'use strict';

  var W = 480;

  // 적기체 설정 생성 헬퍼
  function E(type, x, o) {
    var cfg = { type: type, x: x, y: -30 };
    if (o) for (var k in o) cfg[k] = o[k];
    return cfg;
  }

  /*
   * 스테이지 이벤트: [시간(초), 적기체 설정 ...]
   * waveTime: 웨이브 지속 시간. 이후 보스 등장 경고 → 보스전.
   */
  var STAGES = [
    /* ---------------- STAGE 1: 느린 소형기 직선 탄막 ---------------- */
    {
      name: 'STAGE 1',
      bonus: 1000,
      waveTime: 55,
      boss: { kind: 'A', hp: 60, r: 44, color: '#ff5e6c' },
      events: [
        [1.0, E('small', 90, { vy: 72, fire: 'aimed', fireInterval: 1.6, bulletSpeed: 120 })],
        [1.4, E('small', 240, { vy: 72, fire: 'aimed', fireInterval: 1.6, bulletSpeed: 120 })],
        [1.8, E('small', 390, { vy: 72, fire: 'aimed', fireInterval: 1.6, bulletSpeed: 120 })],
        [6.0, E('small', 60, { vy: 80, fire: 'none' })],
        [6.3, E('small', 140, { vy: 80, fire: 'aimed', fireInterval: 1.5, bulletSpeed: 125 })],
        [6.6, E('small', 220, { vy: 80, fire: 'none' })],
        [6.9, E('small', 300, { vy: 80, fire: 'aimed', fireInterval: 1.5, bulletSpeed: 125 })],
        [7.2, E('small', 380, { vy: 80, fire: 'none' })],
        [12.0, E('small', 240, { vy: 68, fire: 'spread', fireInterval: 1.9, bulletSpeed: 125, splits: 0 })],
        [12.5, E('small', 120, { vy: 75, fire: 'aimed', fireInterval: 1.4, bulletSpeed: 130 })],
        [12.9, E('small', 360, { vy: 75, fire: 'aimed', fireInterval: 1.4, bulletSpeed: 130 })],
        [18.0, E('small', 40, { vy: 85, move: 'sine', sineAmp: 60, sineFreq: 1.2, fire: 'aimed', fireInterval: 1.5, bulletSpeed: 130 })],
        [18.5, E('small', 440, { vy: 85, move: 'sine', sineAmp: 60, sineFreq: 1.2, fire: 'aimed', fireInterval: 1.5, bulletSpeed: 130 })],
        [24.0, E('small', 80, { vy: 90, fire: 'none' })],
        [24.2, E('small', 160, { vy: 90, fire: 'aimed', fireInterval: 1.3, bulletSpeed: 135 })],
        [24.4, E('small', 240, { vy: 90, fire: 'spread', fireInterval: 1.8, bulletSpeed: 130 })],
        [24.6, E('small', 320, { vy: 90, fire: 'aimed', fireInterval: 1.3, bulletSpeed: 135 })],
        [24.8, E('small', 400, { vy: 90, fire: 'none' })],
        [30.0, E('medium', 240, { vy: 60, hp: 3, score: 300, fire: 'spread', fireInterval: 1.7, bulletSpeed: 135 })],
        [30.6, E('small', 100, { vy: 95, fire: 'aimed', fireInterval: 1.3, bulletSpeed: 140 })],
        [30.9, E('small', 380, { vy: 95, fire: 'aimed', fireInterval: 1.3, bulletSpeed: 140 })],
        [36.0, E('small', 240, { vy: 70, move: 'sine', sineAmp: 120, sineFreq: 1.6, fire: 'spread', fireInterval: 1.6, bulletSpeed: 135 })],
        [36.8, E('small', 60, { vy: 95, fire: 'aimed', fireInterval: 1.2, bulletSpeed: 145 })],
        [37.1, E('small', 420, { vy: 95, fire: 'aimed', fireInterval: 1.2, bulletSpeed: 145 })],
        [42.0, E('medium', 120, { vy: 62, hp: 3, score: 300, fire: 'spread', fireInterval: 1.6, bulletSpeed: 140 })],
        [42.3, E('medium', 360, { vy: 62, hp: 3, score: 300, fire: 'spread', fireInterval: 1.6, bulletSpeed: 140 })],
        [48.0, E('small', 80, { vy: 100, fire: 'aimed', fireInterval: 1.1, bulletSpeed: 150 })],
        [48.3, E('small', 200, { vy: 100, fire: 'aimed', fireInterval: 1.1, bulletSpeed: 150 })],
        [48.6, E('small', 320, { vy: 100, fire: 'aimed', fireInterval: 1.1, bulletSpeed: 150 })],
        [48.9, E('small', 440, { vy: 100, fire: 'aimed', fireInterval: 1.1, bulletSpeed: 150 })]
      ]
    },

    /* ---------------- STAGE 2: 곡선 중형기 + 나선 탄막 ---------------- */
    {
      name: 'STAGE 2',
      bonus: 2000,
      waveTime: 62,
      boss: { kind: 'B', hp: 95, r: 48, color: '#ffb347' },
      events: [
        [1.0, E('medium', 60, { vy: 58, hp: 3, score: 300, move: 'curve', cx: 240, ex: 420, fire: 'spiral', fireInterval: 1.1, bulletSpeed: 135 })],
        [1.6, E('medium', 420, { vy: 58, hp: 3, score: 300, move: 'curve', cx: 240, ex: 60, fire: 'spiral', fireInterval: 1.1, bulletSpeed: 135 })],
        [7.0, E('small', 120, { vy: 95, fire: 'aimed', fireInterval: 1.2, bulletSpeed: 145 })],
        [7.3, E('small', 240, { vy: 95, fire: 'spread', fireInterval: 1.6, bulletSpeed: 140 })],
        [7.6, E('small', 360, { vy: 95, fire: 'aimed', fireInterval: 1.2, bulletSpeed: 145 })],
        [13.0, E('medium', 240, { vy: 55, hp: 3, score: 300, move: 'sine', sineAmp: 150, sineFreq: 1.1, fire: 'spiral', fireInterval: 1.0, bulletSpeed: 140 })],
        [19.0, E('medium', 80, { vy: 60, hp: 3, score: 300, move: 'curve', cx: 320, ex: 400, fire: 'spread', fireInterval: 1.5, bulletSpeed: 145 })],
        [19.5, E('medium', 400, { vy: 60, hp: 3, score: 300, move: 'curve', cx: 160, ex: 80, fire: 'spread', fireInterval: 1.5, bulletSpeed: 145 })],
        [25.0, E('small', 60, { vy: 105, fire: 'aimed', fireInterval: 1.1, bulletSpeed: 150 })],
        [25.2, E('small', 180, { vy: 105, fire: 'aimed', fireInterval: 1.1, bulletSpeed: 150 })],
        [25.4, E('small', 300, { vy: 105, fire: 'aimed', fireInterval: 1.1, bulletSpeed: 150 })],
        [25.6, E('small', 420, { vy: 105, fire: 'aimed', fireInterval: 1.1, bulletSpeed: 150 })],
        [31.0, E('medium', 240, { vy: 52, hp: 4, score: 300, move: 'curve', cx: 100, ex: 380, fire: 'spiral', fireInterval: 0.9, bulletSpeed: 150 })],
        [31.5, E('small', 60, { vy: 110, move: 'sine', sineAmp: 70, sineFreq: 1.8, fire: 'aimed', fireInterval: 1.1, bulletSpeed: 155 })],
        [37.0, E('medium', 120, { vy: 62, hp: 3, score: 300, move: 'sine', sineAmp: 90, sineFreq: 1.4, fire: 'spiral', fireInterval: 1.0, bulletSpeed: 150 })],
        [37.4, E('medium', 360, { vy: 62, hp: 3, score: 300, move: 'sine', sineAmp: 90, sineFreq: 1.4, fire: 'spiral', fireInterval: 1.0, bulletSpeed: 150 })],
        [43.0, E('small', 240, { vy: 75, move: 'sine', sineAmp: 160, sineFreq: 1.9, fire: 'spread', fireInterval: 1.4, bulletSpeed: 150 })],
        [43.8, E('small', 100, { vy: 115, fire: 'aimed', fireInterval: 1.0, bulletSpeed: 160 })],
        [44.1, E('small', 380, { vy: 115, fire: 'aimed', fireInterval: 1.0, bulletSpeed: 160 })],
        [49.0, E('medium', 60, { vy: 56, hp: 4, score: 300, move: 'curve', cx: 240, ex: 420, fire: 'spiral', fireInterval: 0.85, bulletSpeed: 155 })],
        [49.4, E('medium', 420, { vy: 56, hp: 4, score: 300, move: 'curve', cx: 240, ex: 60, fire: 'spiral', fireInterval: 0.85, bulletSpeed: 155 })],
        [55.0, E('small', 90, { vy: 120, fire: 'aimed', fireInterval: 1.0, bulletSpeed: 165 })],
        [55.3, E('small', 240, { vy: 120, fire: 'spread', fireInterval: 1.3, bulletSpeed: 160 })],
        [55.6, E('small', 390, { vy: 120, fire: 'aimed', fireInterval: 1.0, bulletSpeed: 165 })]
      ]
    },

    /* ---------------- STAGE 3: 분열 대형기 + 빗발 탄막 ---------------- */
    {
      name: 'STAGE 3',
      bonus: 3000,
      waveTime: 66,
      boss: { kind: 'C', hp: 125, r: 52, color: '#c58aff' },
      events: [
        [1.0, E('large', 240, { vy: 45, hp: 6, score: 800, splits: 3, fire: 'rain', fireInterval: 1.5, bulletSpeed: 140, rainCols: 5 })],
        [7.0, E('small', 80, { vy: 100, fire: 'aimed', fireInterval: 1.1, bulletSpeed: 155 })],
        [7.3, E('small', 400, { vy: 100, fire: 'aimed', fireInterval: 1.1, bulletSpeed: 155 })],
        [12.0, E('large', 120, { vy: 48, hp: 6, score: 800, splits: 3, fire: 'rain', fireInterval: 1.4, bulletSpeed: 145, rainCols: 5 })],
        [12.4, E('large', 360, { vy: 48, hp: 6, score: 800, splits: 3, fire: 'rain', fireInterval: 1.4, bulletSpeed: 145, rainCols: 5 })],
        [19.0, E('medium', 240, { vy: 60, hp: 4, score: 300, move: 'sine', sineAmp: 130, sineFreq: 1.5, fire: 'spread', fireInterval: 1.3, bulletSpeed: 155 })],
        [25.0, E('large', 240, { vy: 42, hp: 7, score: 800, splits: 3, fire: 'rain', fireInterval: 1.3, bulletSpeed: 150, rainCols: 6 })],
        [25.5, E('small', 60, { vy: 110, fire: 'aimed', fireInterval: 1.0, bulletSpeed: 160 })],
        [25.8, E('small', 420, { vy: 110, fire: 'aimed', fireInterval: 1.0, bulletSpeed: 160 })],
        [32.0, E('medium', 90, { vy: 65, hp: 4, score: 300, move: 'curve', cx: 300, ex: 380, fire: 'rain', fireInterval: 1.2, bulletSpeed: 150, rainCols: 4 })],
        [32.4, E('medium', 390, { vy: 65, hp: 4, score: 300, move: 'curve', cx: 180, ex: 100, fire: 'rain', fireInterval: 1.2, bulletSpeed: 150, rainCols: 4 })],
        [39.0, E('large', 160, { vy: 50, hp: 7, score: 800, splits: 3, fire: 'spread', fireInterval: 1.2, bulletSpeed: 160 })],
        [39.4, E('large', 320, { vy: 50, hp: 7, score: 800, splits: 3, fire: 'spread', fireInterval: 1.2, bulletSpeed: 160 })],
        [46.0, E('small', 60, { vy: 120, move: 'sine', sineAmp: 80, sineFreq: 2.0, fire: 'aimed', fireInterval: 1.0, bulletSpeed: 170 })],
        [46.3, E('small', 180, { vy: 120, move: 'sine', sineAmp: 80, sineFreq: 2.0, fire: 'aimed', fireInterval: 1.0, bulletSpeed: 170 })],
        [46.6, E('small', 300, { vy: 120, move: 'sine', sineAmp: 80, sineFreq: 2.0, fire: 'aimed', fireInterval: 1.0, bulletSpeed: 170 })],
        [46.9, E('small', 420, { vy: 120, move: 'sine', sineAmp: 80, sineFreq: 2.0, fire: 'aimed', fireInterval: 1.0, bulletSpeed: 170 })],
        [53.0, E('large', 240, { vy: 46, hp: 8, score: 800, splits: 3, fire: 'rain', fireInterval: 1.2, bulletSpeed: 160, rainCols: 6 })],
        [59.0, E('medium', 120, { vy: 70, hp: 4, score: 300, fire: 'spread', fireInterval: 1.1, bulletSpeed: 165 })],
        [59.3, E('medium', 360, { vy: 70, hp: 4, score: 300, fire: 'spread', fireInterval: 1.1, bulletSpeed: 165 })]
      ]
    },

    /* ---------------- STAGE 4: 고속 기동 + 교차 탄막 + 자폭기 ---------------- */
    {
      name: 'STAGE 4',
      bonus: 4000,
      waveTime: 70,
      boss: { kind: 'D', hp: 155, r: 52, color: '#ff8a3e' },
      events: [
        [1.0, E('small', 60, { vy: 150, move: 'sine', sineAmp: 90, sineFreq: 2.4, fire: 'aimed', fireInterval: 1.0, bulletSpeed: 175 })],
        [1.3, E('small', 420, { vy: 150, move: 'sine', sineAmp: 90, sineFreq: 2.4, fire: 'aimed', fireInterval: 1.0, bulletSpeed: 175 })],
        [6.0, E('medium', 80, { vy: 70, hp: 4, score: 300, move: 'curve', cx: 240, ex: 400, fire: 'spread', fireInterval: 1.1, bulletSpeed: 165 })],
        [6.3, E('medium', 400, { vy: 70, hp: 4, score: 300, move: 'curve', cx: 240, ex: 80, fire: 'spread', fireInterval: 1.1, bulletSpeed: 165 })],
        [12.0, E('kamikaze', 120, { vy: 90, homingDelay: 1.0 })],
        [12.4, E('kamikaze', 360, { vy: 90, homingDelay: 1.0 })],
        [18.0, E('small', 240, { vy: 160, move: 'sine', sineAmp: 170, sineFreq: 2.8, fire: 'spread', fireInterval: 1.0, bulletSpeed: 170 })],
        [18.5, E('small', 100, { vy: 160, fire: 'aimed', fireInterval: 0.9, bulletSpeed: 180 })],
        [18.8, E('small', 380, { vy: 160, fire: 'aimed', fireInterval: 0.9, bulletSpeed: 180 })],
        [24.0, E('medium', 240, { vy: 65, hp: 5, score: 300, move: 'sine', sineAmp: 140, sineFreq: 1.8, fire: 'spiral', fireInterval: 0.9, bulletSpeed: 170 })],
        [24.6, E('kamikaze', 60, { vy: 100, homingDelay: 0.9 })],
        [30.0, E('small', 40, { vy: 170, move: 'sine', sineAmp: 100, sineFreq: 3.0, fire: 'aimed', fireInterval: 0.9, bulletSpeed: 185 })],
        [30.2, E('small', 160, { vy: 170, move: 'sine', sineAmp: 100, sineFreq: 3.0, fire: 'aimed', fireInterval: 0.9, bulletSpeed: 185 })],
        [30.4, E('small', 280, { vy: 170, move: 'sine', sineAmp: 100, sineFreq: 3.0, fire: 'aimed', fireInterval: 0.9, bulletSpeed: 185 })],
        [30.6, E('small', 400, { vy: 170, move: 'sine', sineAmp: 100, sineFreq: 3.0, fire: 'aimed', fireInterval: 0.9, bulletSpeed: 185 })],
        [36.0, E('medium', 100, { vy: 72, hp: 5, score: 300, move: 'curve', cx: 340, ex: 380, fire: 'spread', fireInterval: 1.0, bulletSpeed: 175 })],
        [36.3, E('medium', 380, { vy: 72, hp: 5, score: 300, move: 'curve', cx: 140, ex: 100, fire: 'spread', fireInterval: 1.0, bulletSpeed: 175 })],
        [36.8, E('kamikaze', 240, { vy: 95, homingDelay: 0.8 })],
        [42.0, E('large', 240, { vy: 48, hp: 8, score: 800, splits: 3, fire: 'spread', fireInterval: 1.1, bulletSpeed: 175 })],
        [48.0, E('small', 60, { vy: 180, move: 'sine', sineAmp: 120, sineFreq: 3.2, fire: 'aimed', fireInterval: 0.85, bulletSpeed: 190 })],
        [48.3, E('small', 420, { vy: 180, move: 'sine', sineAmp: 120, sineFreq: 3.2, fire: 'aimed', fireInterval: 0.85, bulletSpeed: 190 })],
        [48.6, E('kamikaze', 180, { vy: 105, homingDelay: 0.8 })],
        [48.9, E('kamikaze', 300, { vy: 105, homingDelay: 0.8 })],
        [54.0, E('medium', 240, { vy: 68, hp: 5, score: 300, move: 'sine', sineAmp: 160, sineFreq: 2.0, fire: 'spiral', fireInterval: 0.8, bulletSpeed: 180 })],
        [54.5, E('small', 100, { vy: 185, fire: 'aimed', fireInterval: 0.8, bulletSpeed: 195 })],
        [54.8, E('small', 380, { vy: 185, fire: 'aimed', fireInterval: 0.8, bulletSpeed: 195 })],
        [60.0, E('kamikaze', 120, { vy: 110, homingDelay: 0.7 })],
        [60.3, E('kamikaze', 240, { vy: 110, homingDelay: 0.7 })],
        [60.6, E('kamikaze', 360, { vy: 110, homingDelay: 0.7 })]
      ]
    },

    /* ---------------- STAGE 5: 복합 난이도 (모든 패턴 혼합) ---------------- */
    {
      name: 'STAGE 5',
      bonus: 5000,
      waveTime: 75,
      boss: { kind: 'E', hp: 230, r: 58, color: '#ff3ea5' },
      events: [
        [1.0, E('large', 240, { vy: 46, hp: 8, score: 800, splits: 3, fire: 'rain', fireInterval: 1.3, bulletSpeed: 165, rainCols: 6 })],
        [1.5, E('kamikaze', 80, { vy: 100, homingDelay: 0.9 })],
        [7.0, E('medium', 60, { vy: 62, hp: 5, score: 300, move: 'curve', cx: 240, ex: 420, fire: 'spiral', fireInterval: 0.85, bulletSpeed: 175 })],
        [7.4, E('medium', 420, { vy: 62, hp: 5, score: 300, move: 'curve', cx: 240, ex: 60, fire: 'spiral', fireInterval: 0.85, bulletSpeed: 175 })],
        [13.0, E('small', 40, { vy: 175, move: 'sine', sineAmp: 110, sineFreq: 3.0, fire: 'aimed', fireInterval: 0.85, bulletSpeed: 190 })],
        [13.2, E('small', 160, { vy: 175, move: 'sine', sineAmp: 110, sineFreq: 3.0, fire: 'aimed', fireInterval: 0.85, bulletSpeed: 190 })],
        [13.4, E('small', 280, { vy: 175, move: 'sine', sineAmp: 110, sineFreq: 3.0, fire: 'aimed', fireInterval: 0.85, bulletSpeed: 190 })],
        [13.6, E('small', 400, { vy: 175, move: 'sine', sineAmp: 110, sineFreq: 3.0, fire: 'aimed', fireInterval: 0.85, bulletSpeed: 190 })],
        [19.0, E('large', 140, { vy: 50, hp: 9, score: 800, splits: 3, fire: 'spread', fireInterval: 1.0, bulletSpeed: 180 })],
        [19.4, E('large', 340, { vy: 50, hp: 9, score: 800, splits: 3, fire: 'spread', fireInterval: 1.0, bulletSpeed: 180 })],
        [26.0, E('medium', 240, { vy: 64, hp: 5, score: 300, move: 'sine', sineAmp: 150, sineFreq: 2.0, fire: 'spiral', fireInterval: 0.75, bulletSpeed: 185 })],
        [26.5, E('kamikaze', 100, { vy: 110, homingDelay: 0.8 })],
        [26.8, E('kamikaze', 380, { vy: 110, homingDelay: 0.8 })],
        [33.0, E('medium', 80, { vy: 66, hp: 5, score: 300, move: 'curve', cx: 320, ex: 400, fire: 'rain', fireInterval: 1.0, bulletSpeed: 170, rainCols: 5 })],
        [33.4, E('medium', 400, { vy: 66, hp: 5, score: 300, move: 'curve', cx: 160, ex: 80, fire: 'rain', fireInterval: 1.0, bulletSpeed: 170, rainCols: 5 })],
        [40.0, E('small', 240, { vy: 190, move: 'sine', sineAmp: 180, sineFreq: 3.4, fire: 'spread', fireInterval: 0.9, bulletSpeed: 195 })],
        [40.4, E('small', 60, { vy: 190, fire: 'aimed', fireInterval: 0.8, bulletSpeed: 200 })],
        [40.7, E('small', 420, { vy: 190, fire: 'aimed', fireInterval: 0.8, bulletSpeed: 200 })],
        [46.0, E('large', 240, { vy: 48, hp: 10, score: 800, splits: 3, fire: 'rain', fireInterval: 1.1, bulletSpeed: 180, rainCols: 7 })],
        [52.0, E('medium', 120, { vy: 68, hp: 6, score: 300, move: 'sine', sineAmp: 120, sineFreq: 2.2, fire: 'spiral', fireInterval: 0.7, bulletSpeed: 190 })],
        [52.4, E('medium', 360, { vy: 68, hp: 6, score: 300, move: 'sine', sineAmp: 120, sineFreq: 2.2, fire: 'spiral', fireInterval: 0.7, bulletSpeed: 190 })],
        [52.8, E('kamikaze', 240, { vy: 115, homingDelay: 0.7 })],
        [58.0, E('small', 60, { vy: 200, move: 'sine', sineAmp: 130, sineFreq: 3.6, fire: 'aimed', fireInterval: 0.75, bulletSpeed: 205 })],
        [58.2, E('small', 180, { vy: 200, move: 'sine', sineAmp: 130, sineFreq: 3.6, fire: 'aimed', fireInterval: 0.75, bulletSpeed: 205 })],
        [58.4, E('small', 300, { vy: 200, move: 'sine', sineAmp: 130, sineFreq: 3.6, fire: 'aimed', fireInterval: 0.75, bulletSpeed: 205 })],
        [58.6, E('small', 420, { vy: 200, move: 'sine', sineAmp: 130, sineFreq: 3.6, fire: 'aimed', fireInterval: 0.75, bulletSpeed: 205 })],
        [64.0, E('large', 160, { vy: 52, hp: 10, score: 800, splits: 3, fire: 'spread', fireInterval: 0.9, bulletSpeed: 190 })],
        [64.4, E('kamikaze', 320, { vy: 120, homingDelay: 0.7 })]
      ]
    }
  ];

  // 스테이지 진행기: 이벤트 타이머 관리
  function StageRunner(stageDef) {
    this.def = stageDef;
    this.time = 0;
    this.eventIdx = 0;
    this.bossPending = false;  // 웨이브 종료, 보스 경고 대기
    this.bossSpawned = false;
  }
  StageRunner.prototype.update = function (dt, fx) {
    this.time += dt;
    var evs = this.def.events;
    while (this.eventIdx < evs.length && this.time >= evs[this.eventIdx][0]) {
      var ev = evs[this.eventIdx++];
      for (var i = 1; i < ev.length; i++) {
        // 일반 몹 3배 증가 (보스전 이전 웨이브). 대형기는 화면 과밀화 방지 위해 2배.
        // 같은 위치 겹침 방지: x 좌표 ±분산 + y 오프셋으로 스태거 스폰.
        var cfg = ev[i];
        var mult = cfg.type === 'large' ? 2 : 3;
        for (var c = 0; c < mult; c++) {
          var ccfg = {};
          for (var k in cfg) ccfg[k] = cfg[k];
          if (c > 0) {
            // 추가 스폰: x 좌표 무작위 분산 + y 위쪽(화면 밖)으로 → 자연스럽게 진입
            ccfg.x = Math.max(24, Math.min(W - 24, cfg.x + (Math.random() * 2 - 1) * 90));
            ccfg.y = cfg.y - c * 30;
          }
          fx.spawnEnemy(ccfg);
        }
      }
    }
    if (!this.bossPending && !this.bossSpawned && this.time >= this.def.waveTime) {
      this.bossPending = true; // main.js가 WARNING 연출 후 spawnBoss() 호출
    }
  };
  StageRunner.prototype.spawnBoss = function (fx) {
    if (this.bossSpawned) return;
    this.bossPending = false;
    this.bossSpawned = true;
    fx.spawnBoss(this.def.boss);
  };

  global.HRJStages = { STAGES: STAGES, StageRunner: StageRunner, W: W };
})(window);
