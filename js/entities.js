/* HRJ SHOOTING - 엔티티: 객체풀(탄/파티클), 플레이어, 적기체, 보스, 파워업 */
(function (global) {
  'use strict';

  var TAU = Math.PI * 2;
  var W = 480, H = 640;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ============================ 탄 객체풀 ============================ */
  // 단순 풀: get()은 선형 탐색, update/forEach는 전체 스캔 (900개 규모에서 충분)
  function BulletPool(max) {
    this.items = new Array(max);
    for (var i = 0; i < max; i++) {
      this.items[i] = { x: 0, y: 0, vx: 0, vy: 0, r: 3, color: '#fff', active: false, homing: 0 };
    }
  }
  BulletPool.prototype.get = function () {
    var arr = this.items;
    for (var i = 0; i < arr.length; i++) {
      if (!arr[i].active) {
        var b = arr[i];
        b.active = true;
        b.homing = 0;
        return b;
      }
    }
    return null; // 풀 고갈: 안전하게 버림
  };
  BulletPool.prototype.forEachActive = function (fn) {
    var arr = this.items, n = arr.length;
    for (var i = 0; i < n; i++) {
      var b = arr[i];
      if (b.active) fn(b);
    }
  };
  BulletPool.prototype.clearActive = function () {
    var arr = this.items, n = arr.length;
    for (var i = 0; i < n; i++) arr[i].active = false;
  };
  BulletPool.prototype.update = function (dt) {
    var arr = this.items, n = arr.length;
    for (var i = 0; i < n; i++) {
      var b = arr[i];
      if (!b.active) continue;
      if (b.homing > 0) {
        b.homing -= dt;
        // 추적탄: 목표 방향으로 서서히 회전
        var tvx = this._targetX - b.x, tvy = this._targetY - b.y;
        var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
        var turn = clamp(2.4 * dt, -0.6, 0.6);
        var ang = Math.atan2(tvy, tvx);
        var cur = Math.atan2(b.vy, b.vx);
        var d = ((ang - cur + Math.PI * 3) % TAU) - Math.PI;
        if (Math.abs(d) > turn) d = (d > 0 ? turn : -turn);
        var na = cur + d;
        b.vx = Math.cos(na) * sp;
        b.vy = Math.sin(na) * sp;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < -24 || b.x > W + 24 || b.y < -30 || b.y > H + 30) {
        b.active = false;
      }
    }
  };

  /* ============================ 파티클 풀 ============================ */
  function ParticlePool(max) {
    this.items = new Array(max);
    for (var i = 0; i < max; i++) {
      this.items[i] = { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, r: 2, color: '#fff', active: false };
    }
    this.activeCount = 0;
  }
  ParticlePool.prototype.spawn = function (x, y, vx, vy, life, r, color) {
    var arr = this.items;
    for (var i = 0; i < arr.length; i++) {
      if (!arr[i].active) {
        var p = arr[i];
        p.x = x; p.y = y; p.vx = vx; p.vy = vy;
        p.life = life; p.maxLife = life; p.r = r; p.color = color; p.active = true;
        this.activeCount++;
        return p;
      }
    }
    return null;
  };
  ParticlePool.prototype.update = function (dt) {
    var arr = this.items, n = arr.length;
    for (var i = 0; i < n; i++) {
      var p = arr[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; this.activeCount--; continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= (1 - 2.2 * dt);
      p.vy *= (1 - 2.2 * dt);
    }
  };
  ParticlePool.prototype.clear = function () {
    var arr = this.items, n = arr.length;
    for (var i = 0; i < n; i++) arr[i].active = false;
    this.activeCount = 0;
  };

  /* ============ 이미지 에셋 로더 (asset/ 폴더, 상대경로) ============ */
  var ASSET_BASE = 'asset/';
  var SPRITES = {
    player: ASSET_BASE + 'flight/KakaoTalk_20260914_175332334_10.png',
    bullet: ASSET_BASE + 'bullet/KakaoTalk_20260914_175332334_02.png',
    boss: {
      A: ASSET_BASE + 'boss/KakaoTalk_20260914_175332334_26.png',
      B: ASSET_BASE + 'boss/KakaoTalk_20260914_175332334_28.png',
      C: ASSET_BASE + 'boss/KakaoTalk_20260914_175335266.png',
      D: ASSET_BASE + 'boss/KakaoTalk_20260914_175335266_02.png',
      E: ASSET_BASE + 'boss/KakaoTalk_20260914_175335266_07.png'
    },
    monster: [
      ASSET_BASE + 'monster/KakaoTalk_20260914_175332334_03.png',
      ASSET_BASE + 'monster/KakaoTalk_20260914_175332334_06.png',
      ASSET_BASE + 'monster/KakaoTalk_20260914_175332334_07.png',
      ASSET_BASE + 'monster/KakaoTalk_20260914_175332334_09.png',
      ASSET_BASE + 'monster/KakaoTalk_20260914_175332334_12.png',
      ASSET_BASE + 'monster/KakaoTalk_20260914_175332334_13.png',
      ASSET_BASE + 'monster/KakaoTalk_20260914_175332334_16.png',
      ASSET_BASE + 'monster/KakaoTalk_20260914_175332334_18.png',
      ASSET_BASE + 'monster/KakaoTalk_20260914_175332334_25.png',
      ASSET_BASE + 'monster/KakaoTalk_20260914_175332334_29.png',
      ASSET_BASE + 'monster/KakaoTalk_20260914_175335266_01.png',
      ASSET_BASE + 'monster/KakaoTalk_20260914_175335266_03.png',
      ASSET_BASE + 'monster/KakaoTalk_20260914_175335266_04.png',
      ASSET_BASE + 'monster/KakaoTalk_20260914_175335266_05.png'
    ]
  };
  // 적기체 타입 → 몬스터 스프라이트 인덱스 범위 (시각적 다양성)
  var MONSTER_IDX = { small: [0, 5], medium: [6, 10], large: [11, 14], kamikaze: [3, 8] };

  var Assets = (function () {
    var cache = {};   // url -> HTMLImageElement
    var loaded = 0, total = 0;
    function load(url) {
      if (cache[url]) return;
      total++;
      var img = new Image();
      img.onload = function () { loaded++; };
      img.onerror = function () { /* 로드 실패 시 벡터 폴백 유지 */ };
      img.src = url;
      cache[url] = img;
    }
    function preload() {
      load(SPRITES.player);
      load(SPRITES.bullet);
      for (var k in SPRITES.boss) load(SPRITES.boss[k]);
      for (var i = 0; i < SPRITES.monster.length; i++) load(SPRITES.monster[i]);
    }
    function get(url) { return cache[url] || null; }
    function ready() { return total > 0 && loaded >= total; }
    preload();
    return { get: get, ready: ready, SPRITES: SPRITES };
  })();

  // 스프라이트 그리기 (로드 전/실패 시 벡터 폴백). rot: 라디안 회전.
  function drawSprite(ctx, url, x, y, w, h, rot) {
    var img = Assets.get(url);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.translate(x, y);
      if (rot) ctx.rotate(rot);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else {
      // 폴백: 원형(이미지 미로드) — 호출부에서 추가 벡터는 직접 그림
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, Math.min(w, h) * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#8899aa';
      ctx.fill();
      ctx.restore();
    }
  }

  /* ============================ 플레이어 ============================ */
  function Player(x, y) {
    this.x = x; this.y = y;
    this.r = 5;            // 히트박스 (작게 — 탄막 슈팅 관례)
    this.hp = 3;
    this.maxHp = 3;
    this.bombs = 3;
    this.invuln = 0;       // 무적 시간(초)
    this.fireTimer = 0;
    this.alive = true;
    this.deathTimer = 0;   // 사망 연출 타이머
    this.speed = 265;
    this.power = 1;        // 무기 강화 레벨 (1~4, 파워업 드랍으로 상승)
    this.laserTimer = 0;   // 레이저 발사 타이머 (power>=3)
  }
  Player.prototype.update = function (dt, input, fx) {
    if (!this.alive) {
      this.deathTimer += dt;
      return;
    }
    var dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    var dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
    this.x = clamp(this.x + dx * this.speed * dt, 16, W - 16);
    this.y = clamp(this.y + dy * this.speed * dt, H * 0.45, H - 24);

    if (input.touch.active) {
      // 터치: 손가락 위치로 이동
      var tx = input.touch.x - this.x, ty = input.touch.y - 60 - this.y;
      var tl = Math.sqrt(tx * tx + ty * ty);
      if (tl > 4) {
        var s = Math.min(this.speed * dt, tl);
        this.x += tx / tl * s;
        this.y += ty / tl * s;
        this.x = clamp(this.x, 16, W - 16);
        this.y = clamp(this.y, H * 0.45, H - 24);
      }
    }

    if (this.invuln > 0) this.invuln -= dt;

    // 자동사격 (파워레벨별 탄막)
    this.fireTimer -= dt;
    var rate = this.power >= 4 ? 0.09 : 0.11;   // 발사 간격(초) — 고레벨일수록 연사
    while (this.fireTimer <= 0) {
      this.fireTimer += rate;
      this.firePattern(fx);
    }
    // 레이저 (power>=3): 주기적 직선 광선
    if (this.power >= 3) {
      this.laserTimer -= dt;
      if (this.laserTimer <= 0) {
        this.laserTimer = this.power >= 4 ? 1.1 : 1.6;
        var lz = fx.playerBullets.get();
        if (lz) {
          lz.x = this.x; lz.y = this.y - 14; lz.vx = 0; lz.vy = -760;
          lz.r = 6; lz.color = '#fff2a8'; lz.laser = true;   // 레이저 표시(렌더용)
        }
      }
    }
  }
  // 파워레벨별 발사 패턴. 각도(라디안, -PI/2=직상)로 탄을 분산.
  Player.prototype.firePattern = function (fx) {
    var speed = 640;
    var self = this;   // 내부 shoot 함수에서 this 참조용
    function shoot(offsetX, angle) {
      var b = fx.playerBullets.get();
      if (!b) return;
      b.x = self.x + offsetX; b.y = self.y - 12;
      b.vx = Math.cos(angle) * speed; b.vy = Math.sin(angle) * speed;
      b.r = 3; b.color = '#9fe8ff';
    }
    var UP = -Math.PI / 2;
    if (this.power <= 1) {
      shoot(-7, UP); shoot(7, UP);
    } else if (this.power === 2) {
      shoot(0, UP); shoot(-9, UP); shoot(9, UP);
    } else if (this.power === 3) {
      shoot(0, UP); shoot(-10, UP); shoot(10, UP);
      shoot(-6, UP - 0.28); shoot(6, UP + 0.28);   // 사방 스프레드
    } else {
      // power 4: 5연발 직선 + 넓은 스프레드
      shoot(0, UP); shoot(-11, UP); shoot(11, UP); shoot(-22, UP); shoot(22, UP);
      shoot(-8, UP - 0.34); shoot(8, UP + 0.34);
    }
    fx.onPlayerShoot && fx.onPlayerShoot();
  };
  Player.prototype.hit = function () {
    if (!this.alive || this.invuln > 0) return false;
    this.hp--;
    this.invuln = 1.5;
    if (this.power > 1) this.power--;   // 피격 시 무기 강화 1단계 손실
    if (this.hp <= 0) {
      this.alive = false;
      this.deathTimer = 0;
    }
    return true;
  };

  /* ============================ 적기체 ============================ */
  // type: small | medium | large | kamikaze
  // move: straight | sine | curve
  // fire: none | aimed | spread | spiral | rain
  function Enemy(cfg) {
    this.type = cfg.type || 'small';
    this.x = cfg.x; this.y = cfg.y;
    this.move = cfg.move || 'straight';
    this.fire = cfg.fire || 'none';
    this.color = cfg.color || '#ff7a5e';
    this.t = 0;
    this.hp = (cfg.hp !== undefined) ? cfg.hp : 1;
    this.maxHp = this.hp;
    this.score = cfg.score || 100;
    this.active = true;
    this.flash = 0;

    // 이동 파라미터
    this.baseX = this.x;
    this.vy = cfg.vy || 70;
    this.sineAmp = cfg.sineAmp || 0;
    this.sineFreq = cfg.sineFreq || 1.5;
    if (this.move === 'curve') {
      this.cx = cfg.cx !== undefined ? cfg.cx : W / 2;
      this.cy = cfg.cy !== undefined ? cfg.cy : H * 0.4;
      this.ex = cfg.ex !== undefined ? cfg.ex : this.x;
      this.evy = cfg.vy || 90;
    }

    // 사격 파라미터
    this.fireTimer = cfg.fireDelay !== undefined ? cfg.fireDelay : 0.6;
    this.fireInterval = cfg.fireInterval || 1.2;
    this.bulletSpeed = cfg.bulletSpeed || 130;
    this.spiralAngle = Math.random() * TAU;
    this.rainCols = cfg.rainCols || 5;

    // 자폭기
    this.homing = false;
    this.homingDelay = cfg.homingDelay || 1.2;

    // 분열 (대형)
    this.splits = cfg.splits || 0;

    // 반경/색상
    if (this.type === 'small') { this.r = 10; }
    else if (this.type === 'medium') { this.r = 15; }
    else if (this.type === 'large') { this.r = 24; }
    else { this.r = 9; } // kamikaze

    // 몬스터 스프라이트 인덱스 (타입별 범위에서 무작위 — 시각적 다양성)
    var rng = MONSTER_IDX[this.type] || [0, SPRITES.monster.length - 1];
    this.spriteIdx = rng[0] + Math.floor(Math.random() * (rng[1] - rng[0] + 1));
  }

  Enemy.prototype.update = function (dt, fx) {
    if (!this.active) return;
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;

    var pl = fx.player;
    var px = pl ? pl.x : W / 2, py = pl ? pl.y : H - 100;

    switch (this.move) {
      case 'straight':
        this.y += this.vy * dt;
        break;
      case 'sine':
        this.y += this.vy * dt;
        this.x = clamp(this.baseX + Math.sin(this.t * this.sineFreq) * this.sineAmp, 12, W - 12);
        break;
      case 'curve': {
        var u = clamp(this.t / (H / this.vy), 0, 1); // 대략적 진행도
        var iu = 1 - u;
        this.x = iu * iu * this.baseX + 2 * iu * u * this.cx + u * u * this.ex;
        this.y += this.evy * dt;
        break;
      }
    }

    // 자폭기: 일정 시간 후 플레이어 방향으로 돌진
    if (this.type === 'kamikaze') {
      if (!this.homing && this.t > this.homingDelay) {
        this.homing = true;
        var dx = px - this.x, dy = py - this.y;
        var l = Math.sqrt(dx * dx + dy * dy) || 1;
        var sp = 250;
        this.vx = dx / l * sp;
        this.vy = dy / l * sp;
      }
      if (this.homing) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
      }
    }

    // 화면 밖 이탈 처리
    if (this.y > H + 40 || this.x < -50 || this.x > W + 50) {
      this.active = false;
      return;
    }

    // 사격
    if (this.fire !== 'none' && this.y > 10 && this.y < H * 0.85 && pl && pl.alive) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer += this.fireInterval;
        this.doFire(fx);
      }
    }
  };

  Enemy.prototype.doFire = function (fx) {
    var B = fx.enemyBullets;
    var px = fx.player.x, py = fx.player.y;
    var sp = this.bulletSpeed;

    switch (this.fire) {
      case 'aimed': {
        var b = B.get();
        if (b) {
          var dx = px - this.x, dy = py - this.y;
          var l = Math.sqrt(dx * dx + dy * dy) || 1;
          b.x = this.x; b.y = this.y + this.r * 0.5;
          b.vx = dx / l * sp; b.vy = dy / l * sp;
          b.r = 4; b.color = '#ffd23e';
        }
        break;
      }
      case 'spread': {
        var n = this.splits > 0 ? 5 : 3;
        var base = Math.atan2(py - this.y, px - this.x);
        for (var i = 0; i < n; i++) {
          var a = base + (i - (n - 1) / 2) * 0.24;
          var c = B.get();
          if (c) {
            c.x = this.x; c.y = this.y;
            c.vx = Math.cos(a) * sp; c.vy = Math.sin(a) * sp;
            c.r = 4; c.color = '#ff8a3e';
          }
        }
        break;
      }
      case 'spiral': {
        for (var j = 0; j < 2; j++) {
          var sa = this.spiralAngle + j * Math.PI;
          var d = B.get();
          if (d) {
            d.x = this.x; d.y = this.y;
            d.vx = Math.cos(sa) * sp * 0.9; d.vy = Math.sin(sa) * sp * 0.9;
            d.r = 4; d.color = '#c58aff';
          }
        }
        this.spiralAngle += 0.55;
        break;
      }
      case 'rain': {
        var cols = this.rainCols;
        for (var k = 0; k < cols; k++) {
          var rx = clamp(this.x + (k - (cols - 1) / 2) * 26, 8, W - 8);
          var e = B.get();
          if (e) {
            e.x = rx; e.y = this.y + 6;
            e.vx = 0; e.vy = sp;
            e.r = 4; e.color = '#7ee0ff';
          }
        }
        break;
      }
    }
  };

  /* ============================ 보스 ============================ */
  // kind: A~E. 스테이지별 패턴 (stages.js에서 hp/속도 스케일링)
  function Boss(cfg) {
    this.kind = cfg.kind;
    this.x = W / 2;
    this.y = -90;
    this.targetY = 110;
    this.r = cfg.r || 46;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.color = cfg.color || '#ff5e6c';
    this.active = true;
    this.entering = true;
    this.t = 0;
    this.phase = 1;
    this.timer = 0;      // 패턴 타이머
    this.shielded = false;
    this.spiralAngle = 0;
    this.wallTimer = 0;
    this.barrageDone = false;
    this.stun = 0;        // 폭탄 스텐 (사격 불가)
    this.flash = 0;
  }

  Boss.prototype.update = function (dt, fx) {
    if (!this.active) return;
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.stun > 0) this.stun -= dt;

    if (this.entering) {
      this.y = lerp(this.y, this.targetY, clamp(2.2 * dt, 0, 1));
      if (Math.abs(this.y - this.targetY) < 2) this.entering = false;
      return;
    }

    var B = fx.enemyBullets;
    var px = fx.player.x, py = fx.player.y;
    this.timer -= dt;
    if (this.stun <= 0 && !this.entering) {
      switch (this.kind) {
        case 'A': this.updateA(dt, fx); break;
        case 'B': this.updateB(dt, fx); break;
        case 'C': this.updateC(dt, fx); break;
        case 'D': this.updateD(dt, fx); break;
        case 'E': this.updateE(dt, fx); break;
      }
    }
  };

  // 공통: 좌우 사인 이동
  function bossSway(b, amp, freq) {
    b.x = W / 2 + Math.sin(b.t * freq) * amp;
  }

  Boss.prototype.updateA = function (dt, fx) {
    // 보스A: 좌우 이동 + 방사탄 3방향(플레이어 기준)
    bossSway(this, 130, 0.9);
    if (this.timer <= 0) {
      this.timer += 0.78;
      var base = Math.atan2(fx.player.y - this.y, fx.player.x - this.x);
      for (var i = 0; i < 3; i++) {
        var a = base + (i - 1) * 0.35;
        var b = fx.enemyBullets.get();
        if (b) {
          b.x = this.x; b.y = this.y + this.r * 0.6;
          b.vx = Math.cos(a) * 170; b.vy = Math.sin(a) * 170;
          b.r = 5; b.color = '#ff6b8a';
        }
      }
    }
  };

  Boss.prototype.updateB = function (dt, fx) {
    // 보스B: 8방향 방사 + 직선 연사 (교대)
    bossSway(this, 100, 0.7);
    if (this.timer <= 0) {
      var phaseIdx = Math.floor(this.t / 2.4) % 2;
      if (phaseIdx === 0) {
        this.timer += 0.85;
        for (var i = 0; i < 8; i++) {
          var a = this.spiralAngle + i * TAU / 8;
          var b = fx.enemyBullets.get();
          if (b) {
            b.x = this.x; b.y = this.y;
            b.vx = Math.cos(a) * 150; b.vy = Math.sin(a) * 150;
            b.r = 5; b.color = '#ffd23e';
          }
        }
        this.spiralAngle += 0.4;
      } else {
        this.timer += 0.13;
        var c = fx.enemyBullets.get();
        if (c) {
          c.x = this.x; c.y = this.y + this.r * 0.5;
          c.vx = 0; c.vy = 300;
          c.r = 4; c.color = '#ff8a3e';
        }
      }
    }
  };

  Boss.prototype.updateC = function (dt, fx) {
    // 보스C: 무적 구간 포함 패턴 전환 2종 (HP 60%에서 전환)
    var ratio = this.hp / this.maxHp;
    if (ratio > 0.6) {
      this.shielded = false;
      bossSway(this, 150, 0.8);
      if (this.timer <= 0) {
        this.timer += 0.9;
        for (var i = 0; i < 2; i++) {
          var a = this.spiralAngle + i * Math.PI;
          var b = fx.enemyBullets.get();
          if (b) {
            b.x = this.x; b.y = this.y;
            b.vx = Math.cos(a) * 160; b.vy = Math.sin(a) * 160;
            b.r = 5; b.color = '#c58aff';
          }
        }
        this.spiralAngle += 0.5;
      }
    } else {
      // 무적(방패) 주기: 4.4초 사이클 = 방패 2.2초 + 취약 2.2초
      if (!this._cInit) { this._cInit = true; this.timer = 4.4; }
      if (this.timer > 2.2) {
        this.shielded = true;
        // 무적: 중앙으로 수렴 + 방패 회전 발사
        this.x = lerp(this.x, W / 2, clamp(1.5 * dt, 0, 1));
        if (Math.floor(this.t * 6) % 2 === 0) {
          var a2 = this.spiralAngle;
          var b2 = fx.enemyBullets.get();
          if (b2) {
            b2.x = this.x + Math.cos(a2) * this.r;
            b2.y = this.y + Math.sin(a2) * this.r;
            b2.vx = Math.cos(a2) * 130; b2.vy = Math.sin(a2) * 130;
            b2.r = 4; b2.color = '#7ee0ff';
          }
          this.spiralAngle += 0.5;
        }
      } else {
        this.shielded = false;
        bossSway(this, 150, 0.8);
      }
      if (this.timer <= 0) this.timer = 4.4; // 주기 재시작
    }
  };

  Boss.prototype.updateD = function (dt, fx) {
    // 보스D: 탄막 벽 개폐 + 추적탄 소량
    bossSway(this, 120, 0.6);
    this.wallTimer += dt;
    var wallOpen = Math.sin(this.t * 0.9) > -0.2; // 주기적으로 열림
    if (wallOpen && this.timer <= 0) {
      this.timer += 0.55;
      // 좌우 벽에서 중앙으로 수렴하는 탄열
      for (var i = 0; i < 3; i++) {
        var l1 = fx.enemyBullets.get();
        if (l1) {
          l1.x = -6; l1.y = this.y + 20 + i * 46;
          l1.vx = 190; l1.vy = 0;
          l1.r = 5; l1.color = '#ff5e6c';
        }
        var r1 = fx.enemyBullets.get();
        if (r1) {
          r1.x = W + 6; r1.y = this.y + 20 + i * 46;
          r1.vx = -190; r1.vy = 0;
          r1.r = 5; r1.color = '#ff5e6c';
        }
      }
    }
    // 추적탄 (약 2.6초마다)
    if (Math.floor(this.t / 2.6) !== Math.floor((this.t - dt) / 2.6)) {
      var h = fx.enemyBullets.get();
      if (h) {
        h.x = this.x; h.y = this.y + this.r * 0.4;
        h.vx = 0; h.vy = 150;
        h.r = 5; h.color = '#ffe9a8';
        h.homing = 2.6;
      }
    }
  };

  Boss.prototype.updateE = function (dt, fx) {
    // 최종보스E: HP 구간별 3단계 패턴 전환, 마지막 대형 탄막
    var ratio = this.hp / this.maxHp;
    if (ratio > 0.66) this.phase = 1;
    else if (ratio > 0.33) this.phase = 2;
    else {
      if (this.phase !== 3 && !this.barrageDone) {
        // 3단계 진입: 대형 탄막 일격
        this.barrageDone = true;
        for (var i = 0; i < 48; i++) {
          var a = i * TAU / 48;
          var b = fx.enemyBullets.get();
          if (b) {
            b.x = this.x; b.y = this.y;
            b.vx = Math.cos(a) * 175; b.vy = Math.sin(a) * 175;
            b.r = 5; b.color = '#ff3ea5';
          }
        }
        for (var j = 0; j < 24; j++) {
          var a2 = j * TAU / 24 + 0.13;
          var b2 = fx.enemyBullets.get();
          if (b2) {
            b2.x = this.x; b2.y = this.y;
            b2.vx = Math.cos(a2) * 120; b2.vy = Math.sin(a2) * 120;
            b2.r = 4; b2.color = '#ffd23e';
          }
        }
      }
      this.phase = 3;
    }

    if (this.phase === 1) {
      bossSway(this, 140, 0.7);
      if (this.timer <= 0) {
        var alt = Math.floor(this.t / 2.0) % 2;
        if (alt === 0) {
          this.timer += 0.8;
          for (var k = 0; k < 10; k++) {
            var a3 = this.spiralAngle + k * TAU / 10;
            var b3 = fx.enemyBullets.get();
            if (b3) {
              b3.x = this.x; b3.y = this.y;
              b3.vx = Math.cos(a3) * 155; b3.vy = Math.sin(a3) * 155;
              b3.r = 5; b3.color = '#ff6b8a';
            }
          }
          this.spiralAngle += 0.42;
        } else {
          this.timer += 0.16;
          var base = Math.atan2(fx.player.y - this.y, fx.player.x - this.x);
          for (var m = 0; m < 3; m++) {
            var a4 = base + (m - 1) * 0.28;
            var b4 = fx.enemyBullets.get();
            if (b4) {
              b4.x = this.x; b4.y = this.y + this.r * 0.5;
              b4.vx = Math.cos(a4) * 190; b4.vy = Math.sin(a4) * 190;
              b4.r = 4; b4.color = '#ffd23e';
            }
          }
        }
      }
    } else if (this.phase === 2) {
      bossSway(this, 160, 0.9);
      if (this.timer <= 0) {
        this.timer += 0.14;
        // 양팔 나선
        for (var s = 0; s < 2; s++) {
          var sa = this.spiralAngle + s * Math.PI;
          var b5 = fx.enemyBullets.get();
          if (b5) {
            b5.x = this.x; b5.y = this.y;
            b5.vx = Math.cos(sa) * 165; b5.vy = Math.sin(sa) * 165;
            b5.r = 4; b5.color = '#c58aff';
          }
        }
        this.spiralAngle += 0.34;
      }
    } else {
      // phase 3: 중앙 고정 + 고밀도 방사 + 추적탄
      this.x = lerp(this.x, W / 2, clamp(1.2 * dt, 0, 1));
      if (this.timer <= 0) {
        this.timer += 0.5;
        for (var q = 0; q < 14; q++) {
          var a5 = this.spiralAngle + q * TAU / 14;
          var b6 = fx.enemyBullets.get();
          if (b6) {
            b6.x = this.x; b6.y = this.y;
            b6.vx = Math.cos(a5) * 185; b6.vy = Math.sin(a5) * 185;
            b6.r = 4; b6.color = '#ff3ea5';
          }
        }
        this.spiralAngle += 0.29;
      }
      if (Math.floor(this.t / 2.2) !== Math.floor((this.t - dt) / 2.2)) {
        var h = fx.enemyBullets.get();
        if (h) {
          h.x = this.x; h.y = this.y + this.r * 0.4;
          h.vx = 0; h.vy = 160;
          h.r = 5; h.color = '#ffe9a8';
          h.homing = 2.4;
        }
      }
    }
  };

  /* ============================ 파워업 ============================ */
  function PowerUp(x, y, kind) {
    this.x = x; this.y = y;
    this.kind = kind; // 'hp' | 'bomb'
    this.vy = 85;
    this.r = 9;
    this.t = Math.random() * TAU;
    this.active = true;
  }
  PowerUp.prototype.update = function (dt) {
    this.t += dt * 4;
    this.y += this.vy * dt;
    if (this.y > H + 20) this.active = false;
  };

  /* ============================ 스타필드 배경 ============================ */
  function Starfield(count) {
    this.stars = [];
    for (var i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        s: 0.5 + Math.random() * 1.6,
        v: 18 + Math.random() * 70,
        tw: Math.random() * TAU
      });
    }
  }
  Starfield.prototype.update = function (dt) {
    for (var i = 0; i < this.stars.length; i++) {
      var st = this.stars[i];
      st.y += st.v * dt;
      st.tw += dt * 3;
      if (st.y > H + 2) { st.y = -2; st.x = Math.random() * W; }
    }
  };

  global.HRJEntities = {
    TAU: TAU, W: W, H: H,
    clamp: clamp, lerp: lerp,
    BulletPool: BulletPool,
    ParticlePool: ParticlePool,
    Player: Player,
    Enemy: Enemy,
    Boss: Boss,
    PowerUp: PowerUp,
    Starfield: Starfield,
    Assets: Assets,
    drawSprite: drawSprite
  };
})(window);
