/* HRJ SHOOTING - 메인 게임 루프 / 상태머신 / 렌더링 / 점수 */
(function () {
  'use strict';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var EN = window.HRJEntities;
  var ST = window.HRJStages;
  var AU = window.HRJAudio;
  var TAU = EN.TAU, W = EN.W, H = EN.H;

  /* ---------------- DOM 참조 ---------------- */
  var el = {
    menu: document.getElementById('menu-screen'),
    pause: document.getElementById('pause-screen'),
    clear: document.getElementById('clear-screen'),
    over: document.getElementById('over-screen'),
    victory: document.getElementById('victory-screen'),
    btnStart: document.getElementById('btn-start'),
    btnResume: document.getElementById('btn-resume'),
    btnNext: document.getElementById('btn-next'),
    btnRetry: document.getElementById('btn-retry'),
    btnRetry2: document.getElementById('btn-retry2'),
    btnMenu1: document.getElementById('btn-menu1'),
    btnMenu2: document.getElementById('btn-menu2'),
    clearStage: document.getElementById('clear-stage'),
    clearKill: document.getElementById('clear-kill'),
    clearTime: document.getElementById('clear-time'),
    clearTotal: document.getElementById('clear-total'),
    clearCum: document.getElementById('clear-cum'),
    clearCountdown: document.getElementById('clear-countdown'),
    overTable: document.getElementById('over-table'),
    victoryTable: document.getElementById('victory-table')
  };

  /* ---------------- 게임 상태 ---------------- */
  var state = 'menu'; // menu | playing | warning | paused | clear | gameover | victory
  var prevState = 'playing'; // 일시정지 전 상태 복원용
  var stageIdx = 0;
  var runner = null;
  var player = null;
  var enemies = [];
  var boss = null;
  var powerups = [];

  var enemyBullets = new EN.BulletPool(900);
  var playerBullets = new EN.BulletPool(120);
  var particles = new EN.ParticlePool(600);
  var stars = new EN.Starfield(70);

  // 점수: stageScores[] = 클리어된 스테이지 [{kill,time,bonus,total}]
  var stageScores = [];
  var cur = { kill: 0, timeSec: 0 }; // 현재 스테이지 부분 점수

  var warningTimer = 0;
  var pendingClear = 0; // 보스 격파 후 클리어 전환 타이머 (정지 안전)
  var clearCountdown = 0;
  var bombFlash = 0;
  var toastTimer = 0;
  var shakeT = 0;

  var input = {
    left: false, right: false, up: false, down: false,
    touch: { active: false, x: 0, y: 0 }
  };

  /* ---------------- 유틸 ---------------- */
  function fmt(n) {
    n = Math.floor(n);
    var s = String(n);
    while (s.length < 6) s = '0' + s;
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function totalScore() {
    var t = cur.kill + Math.floor(cur.timeSec * 10);
    for (var i = 0; i < stageScores.length; i++) t += stageScores[i].total;
    return t;
  }

  function showScreen(which) {
    [el.menu, el.pause, el.clear, el.over, el.victory].forEach(function (s) { s.classList.add('hidden'); });
    if (which === 'menu') el.menu.classList.remove('hidden');
    else if (which === 'pause') el.pause.classList.remove('hidden');
    else if (which === 'clear') el.clear.classList.remove('hidden');
    else if (which === 'over') el.over.classList.remove('hidden');
    else if (which === 'victory') el.victory.classList.remove('hidden');
  }

  /* ---------------- 스테이지 시작/진행 ---------------- */
  function beginStage(i) {
    stageIdx = i;
    runner = new ST.StageRunner(ST.STAGES[i]);
    cur = { kill: 0, timeSec: 0 };
    enemies.length = 0;
    powerups.length = 0;
    boss = null;
    pendingClear = 0;
    enemyBullets.clearActive();
    playerBullets.clearActive();
    particles.clear();
    // 새 스테이지마다 플레이어 상태 재초기화 (HP/폭탄/무적)
    player = new EN.Player(W / 2, H - 80);
    warningTimer = 0;
    state = 'playing';
    showScreen(null);
  }

  function startGame() {
    AU.unlock();
    stageScores = [];
    player = new EN.Player(W / 2, H - 80);
    beginStage(0);
  }

  function nextStage() {
    if (stageIdx >= ST.STAGES.length - 1) { showVictory(); return; }
    beginStage(stageIdx + 1);
  }

  function showMenu() {
    state = 'menu';
    player = null;
    boss = null;
    enemies.length = 0;
    powerups.length = 0;
    enemyBullets.clearActive();
    playerBullets.clearActive();
    particles.clear();
    stageScores = [];
    cur = { kill: 0, timeSec: 0 };
    showScreen('menu');
  }

  /* ---------------- 폭탄 ---------------- */
  function useBomb() {
    if (!player || !player.alive || player.bombs <= 0) return;
    player.bombs--;
    AU.play('bomb');
    bombFlash = 1;
    shakeT = 0.35;
    // 전 화면 적탄 제거 (파티클은 일부만 — 성능)
    var spawned = 0;
    enemyBullets.forEachActive(function (b) {
      if (spawned < 80) {
        particles.spawn(b.x, b.y, (Math.random() - 0.5) * 160, (Math.random() - 0.5) * 160, 0.4, 3, '#fff7d0');
        spawned++;
      }
      b.active = false;
    });
    // 적 전체 피해
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      if (e.active) { e.hp -= 3; if (e.hp <= 0) killEnemy(i, true); }
    }
    if (boss && boss.active && !boss.entering) {
      boss.hp -= 25;
      boss.stun = 1.6;
      if (boss.hp <= 0) destroyBoss();
    }
  }

  /* ---------------- 격파 처리 ---------------- */
  function killEnemy(idx, fromBomb) {
    var e = enemies[idx];
    cur.kill += e.score;
    AU.play('explosion');
    explode(e.x, e.y, e.type === 'large' ? 26 : 14, e.color);
    // 대형기 분열
    if (e.splits > 0) {
      for (var i = 0; i < e.splits; i++) {
        var a = TAU * i / e.splits + Math.random() * 0.5;
        enemies.push(new EN.Enemy({
          type: 'small', x: EN.clamp(e.x + Math.cos(a) * 26, 14, W - 14), y: e.y,
          vy: 130, fire: 'aimed', fireInterval: 1.3, bulletSpeed: 150, score: 100, hp: 1
        }));
      }
    }
    // 파워업 드랍
    if ((e.type === 'medium' || e.type === 'large') && Math.random() < 0.22) {
      powerups.push(new EN.PowerUp(e.x, e.y, Math.random() < 0.5 ? 'hp' : 'bomb'));
    }
    enemies.splice(idx, 1);
  }

  function destroyBoss() {
    if (!boss || !boss.active) return;
    boss.active = false;
    cur.kill += 5000;
    AU.play('bigExplosion');
    explode(boss.x, boss.y, 70, boss.color);
    explode(boss.x, boss.y, 40, '#ffffff');
    shakeT = 0.6;
    pendingClear = 1.0; // update()가 'bossdead' 상태에서 타이머 처리
    state = 'bossdead';
  }

  function explode(x, y, n, color) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU;
      var sp = 40 + Math.random() * 220;
      particles.spawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp,
        0.35 + Math.random() * 0.5, 1.5 + Math.random() * 3, color);
    }
  }

  /* ---------------- 스테이지 클리어 / 승리 / 게임오버 ---------------- */
  function stageClear() {
    var def = ST.STAGES[stageIdx];
    var timeScore = Math.floor(cur.timeSec * 10);
    var killScore = cur.kill;
    var total = killScore + timeScore + def.bonus;
    stageScores.push({ stage: stageIdx, kill: killScore, time: timeScore, bonus: def.bonus, total: total });
    // cur 초기화: 총점(totalScore)에서 이중 합산 방지 (이미 stageScores에 반영됨)
    cur = { kill: 0, timeSec: 0 };
    // 최종 스테이지 클리어 → VICTORY (클리어 화면 생략)
    if (stageIdx >= ST.STAGES.length - 1) { showVictory(); return; }
    AU.play('clear');
    el.clearStage.textContent = String(stageIdx + 1);
    el.clearKill.textContent = fmt(killScore);
    el.clearTime.textContent = fmt(timeScore);
    el.clearTotal.textContent = fmt(total);
    el.clearCum.textContent = fmt(totalScore());
    clearCountdown = 5;
    state = 'clear';
    showScreen('clear');
  }

  function buildResultTable(tableEl, diedAtStage) {
    var html = '';
    for (var i = 0; i < stageScores.length; i++) {
      var sNum = (typeof stageScores[i].stage === 'number') ? stageScores[i].stage + 1 : i + 1;
      html += '<tr><td>ST' + sNum + '</td><td class="num">' + fmt(stageScores[i].total) + '</td></tr>';
    }
    if (diedAtStage !== null) {
      var partial = cur.kill + Math.floor(cur.timeSec * 10);
      html += '<tr><td>ST' + (diedAtStage + 1) + '(사망)</td><td class="num">' + fmt(partial) + '</td></tr>';
    }
    html += '<tr class="final-row"><td>최종 점수</td><td class="num">' + fmt(totalScore()) + '</td></tr>';
    tableEl.innerHTML = html;
  }

  function gameOver() {
    AU.play('gameover');
    buildResultTable(el.overTable, stageIdx);
    state = 'gameover';
    showScreen('over');
  }

  function showVictory() {
    AU.play('victory');
    buildResultTable(el.victoryTable, null);
    state = 'victory';
    showScreen('victory');
  }

  /* ---------------- 일시정지 ---------------- */
  function togglePause() {
    if (state === 'playing' || state === 'warning' || state === 'bossdead') {
      prevState = state;
      state = 'paused';
      showScreen('pause');
    } else if (state === 'paused') {
      state = prevState;
      showScreen(null);
    }
  }

  /* ---------------- fx (엔티티가 호출하는 인터페이스) ---------------- */
  var fx = {
    player: null,
    enemyBullets: enemyBullets,
    playerBullets: playerBullets,
    particles: particles,
    spawnEnemy: function (cfg) { enemies.push(new EN.Enemy(cfg)); },
    spawnBoss: function (cfg) { boss = new EN.Boss(cfg); },
    onPlayerShoot: function () { AU.play('shoot'); }
  };

  /* ---------------- 업데이트 ---------------- */
  function update(dt) {
    stars.update(dt);
    particles.update(dt);
    if (bombFlash > 0) bombFlash = Math.max(0, bombFlash - dt * 2.5);
    if (shakeT > 0) shakeT -= dt;
    if (toastTimer > 0) toastTimer -= dt;

    if (state === 'clear') {
      clearCountdown -= dt;
      el.clearCountdown.textContent = Math.max(0, Math.ceil(clearCountdown)) + '초 후 자동 진행';
      if (clearCountdown <= 0) nextStage();
      return;
    }

    // 보스 격파 연출 → 클리어 화면 (정지해도 타이머가 멈추도록 update 내 관리)
    if (state === 'bossdead') {
      pendingClear -= dt;
      simulate(dt, false);
      if (pendingClear <= 0) stageClear();
      return;
    }

    if (state === 'warning') {
      warningTimer -= dt;
      // 경고 중에도 시뮬레이션 유지 (잔존 적·탄막)
      simulate(dt, false);
      if (warningTimer <= 0) {
        runner.spawnBoss(fx);
        state = 'playing';
      }
      return;
    }

    if (state !== 'playing') return;

    cur.timeSec += dt;

    // 스테이지 이벤트 + 보스 대기
    runner.update(dt, fx);
    if (runner.bossPending && !runner.bossSpawned) {
      state = 'warning';
      warningTimer = 2.6;
      AU.play('warning');
      return;
    }

    simulate(dt, true);
  }

  // 적·보스·탄·파워업 시뮬레이션 (playing/warning 공통)
  function simulate(dt, allowDeath) {
    player.update(dt, input, fx);

    // 적기체
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      e.update(dt, fx);
      if (!e.active) { enemies.splice(i, 1); continue; }
      // 플레이어 충돌
      if (player.alive && player.invuln <= 0) {
        var dx = e.x - player.x, dy = e.y - player.y;
        var rr = e.r + player.r;
        if (dx * dx + dy * dy < rr * rr) {
          player.hit();
          AU.play('playerHit');
          explode(player.x, player.y, 18, '#7ec8ff');
          shakeT = 0.3;
          e.hp = 0;
          killEnemy(i, false);
        }
      }
    }

    // 보스
    if (boss && boss.active) {
      boss.update(dt, fx);
      if (!boss.entering && player.alive && player.invuln <= 0) {
        var dx2 = boss.x - player.x, dy2 = boss.y - player.y;
        var rr2 = boss.r * 0.8 + player.r;
        if (dx2 * dx2 + dy2 * dy2 < rr2 * rr2) {
          player.hit();
          AU.play('playerHit');
          explode(player.x, player.y, 18, '#7ec8ff');
          shakeT = 0.3;
        }
      }
    }

    // 적탄 이동 + 추적탄 목표 설정
    enemyBullets._targetX = player ? player.x : W / 2;
    enemyBullets._targetY = player ? player.y : H - 100;
    enemyBullets.update(dt);

    updatePlayerBullets(dt);

    // 파워업
    for (var p = powerups.length - 1; p >= 0; p--) {
      var pu = powerups[p];
      pu.update(dt);
      if (!pu.active) { powerups.splice(p, 1); continue; }
      if (player.alive) {
        var ddx = pu.x - player.x, ddy = pu.y - player.y;
        if (ddx * ddx + ddy * ddy < 20 * 20) {
          if (pu.kind === 'hp') { player.hp = Math.min(player.maxHp, player.hp + 1); }
          else { player.bombs = Math.min(5, player.bombs + 1); }
          AU.play('select');
          explode(pu.x, pu.y, 8, pu.kind === 'hp' ? '#7dffb0' : '#ffd75e');
          powerups.splice(p, 1);
        }
      }
    }

    // 적탄 → 플레이어 충돌 (플레이어 피격)
    if (player.alive && player.invuln <= 0) {
      var hit = false;
      enemyBullets.forEachActive(function (b) {
        if (hit) return;
        var ddx2 = b.x - player.x, ddy2 = b.y - player.y;
        var rr3 = b.r + player.r;
        if (ddx2 * ddx2 + ddy2 * ddy2 < rr3 * rr3) {
          b.active = false;
          hit = true;
        }
      });
      if (hit) {
        player.hit();
        AU.play('playerHit');
        explode(player.x, player.y, 18, '#7ec8ff');
        shakeT = 0.3;
      }
    }

    // 사망 처리
    if (allowDeath && !player.alive && player.deathTimer > 1.3) {
      gameOver();
    }
  }

  function updatePlayerBullets(dt) {
    playerBullets.update(dt);
    var j;
    playerBullets.forEachActive(function (b) {
      // 적기체 충돌
      for (j = enemies.length - 1; j >= 0; j--) {
        var e = enemies[j];
        var dx = b.x - e.x, dy = b.y - e.y;
        var rr = e.r + b.r;
        if (dx * dx + dy * dy < rr * rr) {
          b.active = false;
          e.hp--;
          particles.spawn(b.x, b.y, 0, -60, 0.15, 2, '#fff');
          if (e.hp <= 0) killEnemy(j, false);
          return;
        }
      }
      // 보스 충돌 (보스C 무적 구간: 방패 중에는 관통)
      if (boss && boss.active && !boss.entering) {
        var invuln = (boss.kind === 'C' && boss.shielded);
        var dx2 = b.x - boss.x, dy2 = b.y - boss.y;
        var rr2 = boss.r + b.r;
        if (dx2 * dx2 + dy2 * dy2 < rr2 * rr2) {
          b.active = false;
          if (!invuln) {
            boss.hp--;
            particles.spawn(b.x, b.y, 0, -60, 0.15, 2, '#ffe9a8');
            if (boss.hp <= 0) destroyBoss();
          } else {
            particles.spawn(b.x, b.y, 0, -40, 0.12, 2, '#7ee0ff');
          }
        }
      }
    });
  }

  /* ---------------- 렌더링 ---------------- */
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 배경
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#050816');
    g.addColorStop(0.6, '#070b20');
    g.addColorStop(1, '#0a0f2e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 화면 흔들림
    if (shakeT > 0) {
      var m = shakeT * 14;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }

    drawStars();
    if (state === 'menu') return; // 메뉴는 DOM 오버레이가 충분히 가림

    for (var i = 0; i < powerups.length; i++) drawPowerUp(powerups[i]);
    for (i = 0; i < enemies.length; i++) drawEnemy(enemies[i]);
    if (boss && boss.active) drawBoss(boss);
    if (player) drawPlayer(player);
    drawBullets();
    drawParticles();

    // 폭탄 플래시
    if (bombFlash > 0) {
      ctx.fillStyle = 'rgba(255,255,240,' + (bombFlash * 0.75).toFixed(3) + ')';
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }

    drawHUD();
    if (state === 'warning') drawWarning();
  }

  function drawStars() {
    for (var i = 0; i < stars.stars.length; i++) {
      var s = stars.stars[i];
      var a = 0.35 + 0.4 * Math.abs(Math.sin(s.tw));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#cfe0ff';
      ctx.fillRect(s.x, s.y, s.s, s.s * 2.2);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer(p) {
    if (!p.alive) {
      // 사망 연출: 폭발 잔해 깜빡임
      if (p.deathTimer < 1.0 && Math.floor(p.deathTimer * 12) % 2 === 0) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#ff9a5e';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8 + p.deathTimer * 20, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      return;
    }
    // 무적 깜빡임
    if (p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0) return;

    ctx.save();
    ctx.translate(p.x, p.y);

    // 엔진 화염
    var fl = 6 + Math.random() * 7;
    var fg = ctx.createLinearGradient(0, 10, 0, 10 + fl + 8);
    fg.addColorStop(0, 'rgba(140,220,255,0.9)');
    fg.addColorStop(1, 'rgba(60,120,255,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-4, 10);
    ctx.lineTo(0, 10 + fl + 8);
    ctx.lineTo(4, 10);
    ctx.closePath();
    ctx.fill();

    // 기체
    var bg = ctx.createLinearGradient(0, -16, 0, 12);
    bg.addColorStop(0, '#eaffff');
    bg.addColorStop(0.5, '#7ec8ff');
    bg.addColorStop(1, '#2a5fd6');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-13, 8);
    ctx.lineTo(-7, 11);
    ctx.lineTo(0, 7);
    ctx.lineTo(7, 11);
    ctx.lineTo(13, 8);
    ctx.lineTo(5, -4);
    ctx.closePath();
    ctx.fill();

    // 콕핏
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -6, 2.4, 0, TAU);
    ctx.fill();

    // 히트박스 표시 (탄막 슈팅 관례)
    ctx.fillStyle = 'rgba(255,80,80,0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    var flash = e.flash > 0;
    if (flash) ctx.globalAlpha = 0.6;

    if (e.type === 'small') {
      var g1 = ctx.createLinearGradient(0, -10, 0, 10);
      g1.addColorStop(0, '#ffd9c8');
      g1.addColorStop(1, e.color);
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(-8, -6);
      ctx.lineTo(0, -2);
      ctx.lineTo(8, -6);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'medium') {
      var g2 = ctx.createLinearGradient(0, -15, 0, 15);
      g2.addColorStop(0, '#ffe9d8');
      g2.addColorStop(1, e.color);
      ctx.fillStyle = g2;
      hexPath(0, 0, 14);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(0, 0, 4 + (e.hp / e.maxHp) * 3, 0, TAU);
      ctx.fill();
    } else if (e.type === 'large') {
      var g3 = ctx.createLinearGradient(0, -24, 0, 24);
      g3.addColorStop(0, '#fff0e6');
      g3.addColorStop(1, e.color);
      ctx.fillStyle = g3;
      hexPath(0, 0, 22);
      ctx.fill();
      // 내핵 + HP 링
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 14, -Math.PI / 2, -Math.PI / 2 + TAU * (e.hp / e.maxHp));
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, TAU);
      ctx.fill();
    } else { // kamikaze
      var blink = 0.5 + 0.5 * Math.sin(e.t * 18);
      ctx.globalAlpha = flash ? 0.6 : (0.55 + 0.45 * blink);
      ctx.fillStyle = '#ff4d4d';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#ffd23e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 11 + blink * 3, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function hexPath(x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = TAU * i / 6 - Math.PI / 2;
      var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawBoss(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    var pulse = 1 + Math.sin(b.t * 3) * 0.03;
    ctx.scale(pulse, pulse);

    // 외곽 갑옷
    var g = ctx.createLinearGradient(0, -b.r, 0, b.r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.25, b.color);
    g.addColorStop(1, shade(b.color));
    ctx.fillStyle = g;
    polyPath(0, 0, b.r, sidesFor(b.kind), b.t * 0.15);
    ctx.fill();

    // 내부 코어
    var cg = ctx.createRadialGradient(0, 0, 2, 0, 0, b.r * 0.55);
    cg.addColorStop(0, '#fff');
    cg.addColorStop(0.5, b.color);
    cg.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, b.r * 0.5, 0, TAU);
    ctx.fill();

    // 타입별 장식
    if (b.kind === 'A') {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 3;
      for (var i = 0; i < 3; i++) {
        var a = b.t * 1.2 + TAU * i / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * b.r * 0.7, Math.sin(a) * b.r * 0.7, 6, 0, TAU);
        ctx.stroke();
      }
    } else if (b.kind === 'B') {
      ctx.fillStyle = '#ffd23e';
      for (var j = 0; j < 8; j++) {
        var a2 = b.t * 0.8 + TAU * j / 8;
        ctx.beginPath();
        ctx.arc(Math.cos(a2) * b.r * 0.75, Math.sin(a2) * b.r * 0.75, 4, 0, TAU);
        ctx.fill();
      }
    } else if (b.kind === 'C') {
      if (b.shielded) {
        ctx.strokeStyle = 'rgba(126,224,255,0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, b.r + 10, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(126,224,255,0.4)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(0, 0, b.r + 10, b.t * 2, b.t * 2 + Math.PI);
        ctx.stroke();
      }
    } else if (b.kind === 'D') {
      ctx.fillStyle = '#ff5e6c';
      var open = Math.sin(b.t * 0.9) > -0.2;
      for (var k = 0; k < 3; k++) {
        ctx.globalAlpha = open ? 0.8 : 0.3;
        ctx.fillRect(-b.r - 6, -14 + k * 20, 12, 10);
        ctx.fillRect(b.r - 6, -14 + k * 20, 12, 10);
      }
      ctx.globalAlpha = 1;
    } else if (b.kind === 'E') {
      // 최종보스: 위상별 색상 링
      var pc = b.phase === 1 ? '#ff6b8a' : (b.phase === 2 ? '#c58aff' : '#ff3ea5');
      ctx.strokeStyle = pc;
      ctx.lineWidth = 3;
      for (var q = 0; q < 3; q++) {
        var a3 = -b.t * (1 + q * 0.4) + TAU * q / 3;
        ctx.beginPath();
        ctx.arc(0, 0, b.r * (0.62 + q * 0.14), a3, a3 + Math.PI * 1.2);
        ctx.stroke();
      }
    }

    // 스텐(폭탄) 연출
    if (b.stun > 0 && Math.floor(b.stun * 10) % 2 === 0) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function sidesFor(kind) {
    return kind === 'A' ? 5 : kind === 'B' ? 6 : kind === 'C' ? 7 : kind === 'D' ? 4 : 8;
  }

  function polyPath(x, y, r, n, rot) {
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var a = TAU * i / n + rot - Math.PI / 2;
      var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function shade(hexColor) {
    // '#rrggbb' → 어두운 색
    var r = parseInt(hexColor.substr(1, 2), 16);
    var g = parseInt(hexColor.substr(3, 2), 16);
    var b = parseInt(hexColor.substr(5, 2), 16);
    return 'rgb(' + Math.floor(r * 0.25) + ',' + Math.floor(g * 0.25) + ',' + Math.floor(b * 0.35) + ')';
  }

  function drawBullets() {
    // 적탄: 외곽 글로우 + 흰 코어 (라디얼 그라데이션 없이 2회 원 그리기 — 성능)
    enemyBullets.forEachActive(function (b) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 3, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.55, 0, TAU);
      ctx.fill();
    });
    // 플레이어 탄
    ctx.fillStyle = '#bff3ff';
    playerBullets.forEachActive(function (b) {
      ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
      ctx.fillStyle = '#fff';
      ctx.fillRect(b.x - 1, b.y - 6, 2, 5);
      ctx.fillStyle = '#bff3ff';
    });
  }

  function drawParticles() {
    var arr = particles.items, n = particles.activeCount;
    for (var i = 0; i < n; i++) {
      var p = arr[i];
      if (!p.active) continue;
      var a = p.life / p.maxLife;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.5 + a * 0.5), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPowerUp(pu) {
    ctx.save();
    ctx.translate(pu.x, pu.y);
    var bob = Math.sin(pu.t) * 2;
    ctx.translate(0, bob);
    if (pu.kind === 'hp') {
      ctx.fillStyle = '#7dffb0';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-1.5, -4.5, 3, 9);
      ctx.fillRect(-4.5, -1.5, 9, 3);
    } else {
      ctx.fillStyle = '#ffd75e';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('B', 0, 1);
    }
    ctx.restore();
  }

  function drawHUD() {
    if (!player) return;
    ctx.save();
    // 좌상단: 점수 + 스테이지
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 15px Consolas, monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('SCORE ' + fmt(totalScore()), 12, 10);
    ctx.font = '11px Consolas, monospace';
    ctx.fillStyle = '#9fb4ff';
    ctx.fillText(ST.STAGES[stageIdx].name + '  ·  ' + (stageIdx + 1) + '/5', 12, 30);

    // HP 바
    var hpX = 12, hpY = 48;
    ctx.font = '10px Consolas, monospace';
    ctx.fillStyle = '#9fb4ff';
    ctx.fillText('HP', hpX, hpY + 1);
    for (var i = 0; i < player.maxHp; i++) {
      var x = hpX + 20 + i * 26;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x, hpY, 22, 8);
      if (i < player.hp) {
        ctx.fillStyle = player.hp === 1 ? '#ff5e6c' : '#7dffb0';
        ctx.fillRect(x + 1, hpY + 1, 20, 6);
      }
    }

    // 우상단: 폭탄 수
    ctx.textAlign = 'right';
    ctx.font = '11px Consolas, monospace';
    ctx.fillStyle = '#9fb4ff';
    ctx.fillText('BOMB', W - 12, 10);
    for (var j = 0; j < player.bombs; j++) {
      var bx = W - 18 - j * 16;
      ctx.fillStyle = '#ffd75e';
      ctx.beginPath();
      ctx.arc(bx, 32, 5.5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx + 3, 27);
      ctx.lineTo(bx + 6, 24);
      ctx.stroke();
    }

    // 보스 HP 바
    if (boss && boss.active) {
      var bw = 300, bx2 = (W - bw) / 2;
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px Consolas, monospace';
      ctx.fillStyle = '#ffb0b8';
      ctx.fillText('BOSS ' + boss.kind, W / 2, 64);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(bx2, 78, bw, 8);
      var ratio = Math.max(0, boss.hp / boss.maxHp);
      var bg2 = ctx.createLinearGradient(bx2, 0, bx2 + bw, 0);
      bg2.addColorStop(0, '#ff5e6c');
      bg2.addColorStop(1, '#ffd75e');
      ctx.fillStyle = bg2;
      ctx.fillRect(bx2 + 1, 79, (bw - 2) * ratio, 6);
    }

    // 사운드 토스트
    if (toastTimer > 0) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 13px Consolas, monospace';
      ctx.globalAlpha = Math.min(1, toastTimer * 2);
      ctx.fillStyle = '#fff';
      ctx.fillText(AU.isMuted() ? 'SOUND OFF' : 'SOUND ON', W / 2, H - 24);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawWarning() {
    var flash = Math.floor(warningTimer * 3) % 2 === 0;
    // 상하 적색 스트라이프
    ctx.fillStyle = 'rgba(180,20,40,' + (flash ? 0.55 : 0.25) + ')';
    ctx.fillRect(0, H * 0.36, W, 10);
    ctx.fillRect(0, H * 0.62, W, 10);

    if (flash) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 44px Consolas, monospace';
      ctx.fillStyle = '#ff3b4e';
      ctx.shadowColor = '#ff3b4e';
      ctx.shadowBlur = 18;
      ctx.fillText('WARNING', W / 2, H * 0.5);
      ctx.shadowBlur = 0;
      ctx.font = 'bold 16px "Malgun Gothic", sans-serif';
      ctx.fillStyle = '#ffd7d7';
      ctx.fillText('보스 접근 중!', W / 2, H * 0.5 + 38);
    }
  }

  /* ---------------- 입력 ---------------- */
  var KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down'
  };

  function unlockAudio() { AU.unlock(); }

  window.addEventListener('keydown', function (ev) {
    if (KEYMAP[ev.code]) {
      input[KEYMAP[ev.code]] = true;
      ev.preventDefault();
      return;
    }
    switch (ev.code) {
      case 'Space':
        ev.preventDefault();
        unlockAudio();
        if (!ev.repeat && (state === 'playing' || state === 'warning' || state === 'bossdead')) useBomb();
        break;
      case 'KeyP':
      case 'Escape':
        ev.preventDefault();
        togglePause();
        break;
      case 'KeyM':
        AU.unlock();
        var m = AU.toggleMute();
        toastTimer = 1.2;
        break;
      case 'Enter':
        if (state === 'menu') { unlockAudio(); startGame(); }
        else if (state === 'clear') nextStage();
        break;
    }
  });

  window.addEventListener('keyup', function (ev) {
    if (KEYMAP[ev.code]) input[KEYMAP[ev.code]] = false;
  });

  // 터치: 1지점 드래그 = 이동, 2지점 탭 = 폭탄
  var touchCount = 0;
  canvas.addEventListener('touchstart', function (ev) {
    ev.preventDefault();
    unlockAudio();
    touchCount = ev.touches.length;
    if (ev.touches.length >= 2) {
      if (state === 'playing' || state === 'warning') useBomb();
      input.touch.active = false;
      return;
    }
    var t = ev.touches[0];
    setTouch(t);
    input.touch.active = true;
  }, { passive: false });

  canvas.addEventListener('touchmove', function (ev) {
    ev.preventDefault();
    if (ev.touches.length === 1 && input.touch.active) setTouch(ev.touches[0]);
  }, { passive: false });

  canvas.addEventListener('touchend', function (ev) {
    ev.preventDefault();
    if (ev.touches.length === 0) input.touch.active = false;
  }, { passive: false });

  function setTouch(t) {
    var r = canvas.getBoundingClientRect();
    input.touch.x = (t.clientX - r.left) / r.width * W;
    input.touch.y = (t.clientY - r.top) / r.height * H;
  }

  // 버튼 (클릭 후 포커스 제거 → 스페이스가 버튼 재클릭 되는 것 방지)
  function wireButton(btn, fn) {
    btn.addEventListener('click', function () {
      unlockAudio();
      AU.play('select');
      fn();
      btn.blur();
    });
  }

  wireButton(el.btnStart, startGame);
  wireButton(el.btnResume, togglePause);
  wireButton(el.btnNext, nextStage);
  wireButton(el.btnRetry, startGame);
  wireButton(el.btnRetry2, startGame);
  wireButton(el.btnMenu1, showMenu);
  wireButton(el.btnMenu2, showMenu);

  // 탭 전환 시 자동 일시정지
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && (state === 'playing' || state === 'warning' || state === 'bossdead')) togglePause();
  });

  /* ---------------- 메인 루프 ---------------- */
  var lastTs = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!lastTs) lastTs = ts;
    var dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.05) dt = 0.05; // 프레임 드랍 시 클램프
    if (dt <= 0) return;

    fx.player = player; // 엔티티가 읽는 플레이어 참조 갱신
    update(dt);
    render();
  }

  showScreen('menu');
  requestAnimationFrame(frame);

  /* ---------------- 디버그 훅 (자동화 테스트용) ---------------- */
  window.__HRJ_DEBUG = {
    get state() { return state; },
    get stage() { return stageIdx + 1; },
    score: function () { return totalScore(); },
    player: function () { return player; },          // 원본 참조 (테스트에서 위치 조작 가능)
    enemies: function () { return enemies.length; },
    boss: function () { return boss ? { hp: boss.hp, maxHp: boss.maxHp, active: boss.active } : null; },
    ebullets: function () { var n = 0; enemyBullets.forEachActive(function () { n++; }); return n; },
    // 시뮬레이션만 실시간 대기 없이 진행 (스모크 테스트용)
    step: function (sec) {
      var n = Math.max(1, Math.floor(sec / 0.016));
      for (var i = 0; i < n; i++) { fx.player = player; update(0.016); }
      render();
    },
    // 특정 스테이지 바로 시작 (테스트용)
    gotoStage: function (i) { beginStage(i - 1); }
  };
})();
