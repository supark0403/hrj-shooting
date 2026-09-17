/* HRJ SHOOTING - WebAudio 합성 효과음 (외부 오디오 파일 없음) */
(function (global) {
  'use strict';

  var ctx = null;
  var master = null;
  var noiseBuf = null;
  var muted = false;
  var VOL = 0.5;
  var lastShootAt = 0;

  function ensure() {
    if (ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOL;
    master.connect(ctx.destination);
    // 1.2초 백색 노이즈 버퍼 (폭발음 등 재사용)
    var len = Math.floor(ctx.sampleRate * 1.2);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function resume() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') {
      var p = ctx.resume();
      if (p && p.catch) p.catch(function () {});
    }
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  // 기본 톤: osc + 이펙트(주파수 램프, 게인 엔벨로프)
  function tone(type, f0, f1, dur, peak, when, attack) {
    if (!ctx || muted) return;
    var t = now() + (when || 0);
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(1, f0), t);
    if (f1 !== undefined && f1 !== f0) {
      o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    }
    var a = attack || 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  // 노이즈 톤: bandpass 필터 스윕
  function noise(dur, peak, when, f0, f1, q) {
    if (!ctx || muted || !noiseBuf) return;
    var t = now() + (when || 0);
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    var filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(Math.max(20, f0 || 800), t);
    if (f1 && f1 !== f0) {
      filt.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    }
    filt.Q.value = q || 0.8;
    var g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.03);
  }

  var S = {
    // 발사음 (자동사격이라 저음량 + 스로틀)
    shoot: function () {
      var t = performance.now();
      if (t - lastShootAt < 55) return;
      lastShootAt = t;
      tone('square', 900, 430, 0.06, 0.05);
    },
    // 적 폭발
    explosion: function () {
      noise(0.32, 0.45, 0, 1500, 140, 0.7);
      tone('sine', 240, 42, 0.28, 0.3);
    },
    // 대형 폭발 (보스 격파)
    bigExplosion: function () {
      noise(0.9, 0.8, 0, 1100, 60, 0.6);
      tone('sine', 170, 30, 0.8, 0.5);
      tone('triangle', 95, 24, 1.0, 0.4, 0.06);
    },
    // 플레이어 피격
    playerHit: function () {
      noise(0.5, 0.7, 0, 700, 80, 0.9);
      tone('sawtooth', 320, 55, 0.45, 0.35);
    },
    // 폭탄
    bomb: function () {
      noise(1.1, 0.85, 0, 2200, 50, 0.5);
      tone('sine', 85, 28, 1.0, 0.55);
      tone('square', 1300, 220, 0.45, 0.12, 0.04);
    },
    // 보스 등장 경고 (사이렌)
    warning: function () {
      for (var i = 0; i < 8; i++) {
        var f = (i % 2 === 0) ? 790 : 530;
        tone('square', f, f, 0.22, 0.14, i * 0.26);
      }
    },
    // 스테이지 클리어 (상승 아르페지오)
    clear: function () {
      var seq = [523.25, 659.25, 783.99, 1046.5];
      for (var i = 0; i < seq.length; i++) {
        tone('triangle', seq[i], seq[i], 0.22, 0.28, i * 0.12);
      }
      tone('triangle', 1318.5, 1318.5, 0.55, 0.26, 0.52);
    },
    // 게임 오버 (하강)
    gameover: function () {
      var seq = [392, 311.13, 246.94, 196];
      for (var i = 0; i < seq.length; i++) {
        tone('sawtooth', seq[i], seq[i] * 0.97, 0.5, 0.2, i * 0.34);
      }
    },
    // 승리 (파나재)
    victory: function () {
      var seq = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
      for (var i = 0; i < seq.length; i++) {
        tone('square', seq[i], seq[i], 0.24, 0.16, i * 0.15);
      }
    },
    // UI 선택음
    select: function () {
      tone('triangle', 680, 1020, 0.09, 0.18);
    }
  };

  global.HRJAudio = {
    unlock: resume,   // 첫 사용자 제스처(버튼 클릭) 시 호출
    resume: resume,
    play: function (name) {
      if (!ctx || muted) return;
      var fn = S[name];
      if (fn) fn();
    },
    setMuted: function (m) {
      muted = !!m;
      if (master) master.gain.value = muted ? 0 : VOL;
    },
    toggleMute: function () {
      var m = !muted;
      this.setMuted(m);
      return m;
    },
    isMuted: function () { return muted; }
  };
})(window);
