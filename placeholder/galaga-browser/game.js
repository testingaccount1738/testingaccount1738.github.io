const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const STATE = {
  ATTRACT: "attract",
  PLAYING: "playing",
  GAME_OVER: "game_over",
};

const STARTING_LIVES = 5;

const input = {
  left: false,
  right: false,
  fire: false,
};

const game = {
  width: canvas.width,
  height: canvas.height,
  state: STATE.ATTRACT,
  lastTime: 0,
  score: 0,
  lives: STARTING_LIVES,
  level: 1,
  stars: [],
  player: null,
  bullets: [],
  enemyBullets: [],
  enemies: [],
  formationDirection: 1,
  formationOffsetX: 0,
  formationSpeed: 44,
  cycleTimer: 0,
  overlayFlash: 0,
  levelBannerTimer: 0,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeInOut(amount) {
  if (amount < 0.5) {
    return 2 * amount * amount;
  }

  return 1 - Math.pow(-2 * amount + 2, 2) / 2;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function shuffle(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(Math.random() * (i + 1));
    [array[i], array[swapIndex]] = [array[swapIndex], array[i]];
  }

  return array;
}

function createStars() {
  return Array.from({ length: 110 }, () => ({
    x: Math.random() * game.width,
    y: Math.random() * game.height,
    radius: Math.random() * 1.8 + 0.4,
    speed: Math.random() * 40 + 20,
    alpha: Math.random() * 0.7 + 0.25,
  }));
}

function createPlayer() {
  return {
    width: 34,
    height: 24,
    x: game.width / 2 - 17,
    y: game.height - 60,
    speed: 360,
    cooldown: 0,
    hitTimer: 0,
  };
}

function getLevelSettings(level) {
  return {
    rows: Math.min(6, 4 + Math.floor((level - 1) / 2)),
    cols: 9,
    formationSpeed: 40 + level * 4,
    attackGroupSize: Math.min(3 + Math.floor((level - 1) / 2), 7),
    cycleDelay: Math.max(0.6, 2.05 - level * 0.12),
    launchSpacing: Math.max(0.07, 0.18 - level * 0.008),
    loops: Math.min(1.15 + level * 0.08, 2.2),
    radiusX: Math.min(170, 92 + level * 8),
    radiusY: Math.min(132, 58 + level * 6),
    bombMin: Math.max(0.24, 0.82 - level * 0.04),
    bombMax: Math.max(0.56, 1.22 - level * 0.05),
  };
}

function createWave(level) {
  const settings = getLevelSettings(level);
  const enemies = [];
  const spacingX = 72;
  const spacingY = 50;
  const formationWidth = (settings.cols - 1) * spacingX + 28;
  const originX = (game.width - formationWidth) / 2;
  const originY = 92;

  for (let row = 0; row < settings.rows; row += 1) {
    for (let col = 0; col < settings.cols; col += 1) {
      enemies.push({
        width: 28,
        height: 22,
        x: originX + col * spacingX,
        y: originY + row * spacingY,
        baseX: originX + col * spacingX,
        baseY: originY + row * spacingY,
        row,
        col,
        alive: true,
        mode: "formation",
        launchDelay: 0,
        hoverPhase: Math.random() * Math.PI * 2,
        bombCooldown: rand(settings.bombMin, settings.bombMax),
        attack: null,
        scoreValue: row === 0 ? 220 : row <= 1 ? 170 : row <= 3 ? 130 : 100,
      });
    }
  }

  game.formationSpeed = settings.formationSpeed;
  return enemies;
}

function beginWave(level) {
  game.bullets = [];
  game.enemyBullets = [];
  game.enemies = createWave(level);
  game.formationDirection = Math.random() > 0.5 ? 1 : -1;
  game.formationOffsetX = 0;
  game.cycleTimer = 1.25;
  game.levelBannerTimer = 1.6;
}

function resetGame() {
  game.state = STATE.ATTRACT;
  game.score = 0;
  game.lives = STARTING_LIVES;
  game.level = 1;
  game.stars = createStars();
  game.player = createPlayer();
  game.overlayFlash = 0;
  beginWave(game.level);
}

function startGame() {
  game.state = STATE.PLAYING;
  game.score = 0;
  game.lives = STARTING_LIVES;
  game.level = 1;
  game.player = createPlayer();
  game.overlayFlash = 0;
  if (!game.stars.length) {
    game.stars = createStars();
  }
  beginWave(game.level);
}

function nextLevel() {
  game.level += 1;
  beginWave(game.level);
}

function spawnPlayerBullet() {
  game.bullets.push({
    x: game.player.x + game.player.width / 2 - 2,
    y: game.player.y - 10,
    width: 4,
    height: 14,
    speed: 520,
  });
}

function spawnEnemyBullet(enemy) {
  const originX = enemy.x + enemy.width / 2 - 3;
  const originY = enemy.y + enemy.height + 2;
  const playerCenterX = game.player ? game.player.x + game.player.width / 2 : enemy.x;
  const dx = playerCenterX - (enemy.x + enemy.width / 2);
  const dy = (game.player ? game.player.y : game.height) - originY;
  const distance = Math.hypot(dx, dy) || 1;
  const speed = 240 + game.level * 16;

  game.enemyBullets.push({
    x: originX,
    y: originY,
    width: 6,
    height: 12,
    vx: (dx / distance) * speed * 0.42,
    vy: Math.max(190, (dy / distance) * speed),
  });
}

function buildAttackPattern(enemy, index, groupSize) {
  const settings = getLevelSettings(game.level);
  const side = enemy.baseX < game.width / 2 ? 1 : -1;
  const spread = index - (groupSize - 1) / 2;

  return {
    phaseTime: 0,
    side,
    launchDuration: 0.42 + index * 0.04,
    loopDuration: 1.45 + settings.loops * 0.34,
    sweepDuration: 0.9,
    returnDuration: 0.92,
    launchTargetX: clamp(enemy.x + side * (54 + Math.abs(spread) * 22), 84, game.width - 84),
    launchTargetY: 130 + enemy.row * 18,
    centerX: clamp(game.width / 2 + spread * 54 + side * 76, 150, game.width - 150),
    centerY: 198 + enemy.row * 10 + Math.abs(spread) * 10,
    radiusX: settings.radiusX + Math.abs(spread) * 10,
    radiusY: settings.radiusY + Math.abs(spread) * 8,
    startAngle: side > 0 ? Math.PI * 1.05 : Math.PI * -0.05,
    angleSpan: (side > 0 ? -1 : 1) * Math.PI * 2 * settings.loops,
    diveTargetX: clamp(game.width / 2 - side * (120 + spread * 28), 92, game.width - 92),
    diveTargetY: game.height - 118 + Math.abs(spread) * 12,
  };
}

function pickAttackGroup() {
  const settings = getLevelSettings(game.level);
  const available = game.enemies.filter((enemy) => enemy.alive && enemy.mode === "formation");
  if (!available.length) {
    return;
  }

  const preferred = available.filter((enemy) => enemy.row < Math.min(3, settings.rows));
  const pool = preferred.length ? preferred : available;
  const anchor = pool[Math.floor(Math.random() * pool.length)];
  const desiredSize = Math.min(settings.attackGroupSize, available.length);

  const distanceToAnchor = (enemy) =>
    Math.abs(enemy.col - anchor.col) + Math.abs(enemy.row - anchor.row) * 2;

  const selected = [];
  for (const enemy of [...pool].sort((a, b) => distanceToAnchor(a) - distanceToAnchor(b))) {
    if (selected.length >= desiredSize) {
      break;
    }
    selected.push(enemy);
  }

  if (selected.length < desiredSize) {
    for (const enemy of available) {
      if (selected.includes(enemy)) {
        continue;
      }
      selected.push(enemy);
      if (selected.length >= desiredSize) {
        break;
      }
    }
  }

  const ordered = shuffle(selected).sort((a, b) => a.baseX - b.baseX);
  for (let index = 0; index < ordered.length; index += 1) {
    const enemy = ordered[index];
    enemy.mode = "queued";
    enemy.launchDelay = index * settings.launchSpacing;
    enemy.attack = buildAttackPattern(enemy, index, ordered.length);
  }

  game.cycleTimer = settings.cycleDelay;
}

function hasActiveAttackers() {
  return game.enemies.some((enemy) => enemy.alive && enemy.mode !== "formation");
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function handlePlayerHit() {
  if (!game.player || game.player.hitTimer > 0 || game.state !== STATE.PLAYING) {
    return;
  }

  game.lives -= 1;
  game.player.hitTimer = 1.4;
  game.overlayFlash = 0.28;
  game.bullets = [];
  game.enemyBullets = [];

  if (game.lives <= 0) {
    game.state = STATE.GAME_OVER;
  } else {
    game.player.x = game.width / 2 - game.player.width / 2;
  }
}

function updateStars(dt) {
  for (const star of game.stars) {
    star.y += star.speed * dt;
    if (star.y > game.height) {
      star.y = -4;
      star.x = Math.random() * game.width;
    }
  }
}

function updatePlayer(dt) {
  if (!game.player) {
    return;
  }

  const move = (input.left ? -1 : 0) + (input.right ? 1 : 0);
  game.player.x += move * game.player.speed * dt;
  game.player.x = clamp(game.player.x, 20, game.width - game.player.width - 20);

  game.player.cooldown = Math.max(0, game.player.cooldown - dt);
  game.player.hitTimer = Math.max(0, game.player.hitTimer - dt);

  if (input.fire && game.player.cooldown === 0 && game.state === STATE.PLAYING) {
    spawnPlayerBullet();
    game.player.cooldown = 0.16;
  }
}

function updateBullets(dt) {
  for (const bullet of game.bullets) {
    bullet.y -= bullet.speed * dt;
  }

  for (const bullet of game.enemyBullets) {
    bullet.x += (bullet.vx || 0) * dt;
    bullet.y += (bullet.vy || 0) * dt;
  }

  game.bullets = game.bullets.filter((bullet) => bullet.y + bullet.height > 0);
  game.enemyBullets = game.enemyBullets.filter(
    (bullet) =>
      bullet.y < game.height + 30 && bullet.x > -30 && bullet.x < game.width + 30,
  );
}

function updateFormation(dt) {
  const formationEnemies = game.enemies.filter(
    (enemy) => enemy.alive && (enemy.mode === "formation" || enemy.mode === "queued"),
  );

  if (!formationEnemies.length) {
    return;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  for (const enemy of formationEnemies) {
    minX = Math.min(minX, enemy.baseX + game.formationOffsetX);
    maxX = Math.max(maxX, enemy.baseX + game.formationOffsetX + enemy.width);
  }

  game.formationOffsetX += game.formationDirection * game.formationSpeed * dt;

  if (minX < 30 || maxX > game.width - 30) {
    game.formationDirection *= -1;
  }
}

function updateAttackingEnemy(enemy, dt, now, settings) {
  const attack = enemy.attack;
  if (!attack) {
    enemy.mode = "formation";
    return;
  }

  attack.phaseTime += dt;

  if (enemy.mode === "launching") {
    const progress = Math.min(1, attack.phaseTime / attack.launchDuration);
    const eased = easeInOut(progress);
    enemy.x = lerp(attack.startX, attack.launchTargetX, eased);
    enemy.y =
      lerp(attack.startY, attack.launchTargetY, eased) - Math.sin(progress * Math.PI) * 42;

    if (progress >= 1) {
      enemy.mode = "looping";
      attack.phaseTime = 0;
    }
    return;
  }

  if (enemy.mode === "looping") {
    const progress = Math.min(1, attack.phaseTime / attack.loopDuration);
    const angle = attack.startAngle + attack.angleSpan * progress;
    enemy.x = attack.centerX + Math.cos(angle) * attack.radiusX;
    enemy.y = attack.centerY + Math.sin(angle) * attack.radiusY;

    enemy.bombCooldown -= dt;
    if (enemy.bombCooldown <= 0) {
      spawnEnemyBullet(enemy);
      enemy.bombCooldown = rand(settings.bombMin, settings.bombMax);
    }

    if (progress >= 1) {
      enemy.mode = "sweeping";
      attack.phaseTime = 0;
      attack.sweepStartX = enemy.x;
      attack.sweepStartY = enemy.y;
    }
    return;
  }

  if (enemy.mode === "sweeping") {
    const progress = Math.min(1, attack.phaseTime / attack.sweepDuration);
    const eased = easeInOut(progress);
    enemy.x =
      lerp(attack.sweepStartX, attack.diveTargetX, eased) +
      Math.sin(progress * Math.PI * 2) * attack.side * 42;
    enemy.y =
      lerp(attack.sweepStartY, attack.diveTargetY, progress) +
      Math.sin(progress * Math.PI) * 24;

    enemy.bombCooldown -= dt * 1.35;
    if (enemy.bombCooldown <= 0) {
      spawnEnemyBullet(enemy);
      enemy.bombCooldown = rand(settings.bombMin * 0.75, settings.bombMax * 0.82);
    }

    if (progress >= 1) {
      enemy.mode = "returning";
      attack.phaseTime = 0;
      attack.returnStartX = enemy.x;
      attack.returnStartY = enemy.y;
    }
    return;
  }

  if (enemy.mode === "returning") {
    const progress = Math.min(1, attack.phaseTime / attack.returnDuration);
    const targetX = enemy.baseX + game.formationOffsetX;
    const targetY = enemy.baseY + Math.sin(now * 2 + enemy.hoverPhase + enemy.col * 0.25) * 4;
    const eased = easeInOut(progress);

    enemy.x = lerp(attack.returnStartX, targetX, eased);
    enemy.y = lerp(attack.returnStartY, targetY, eased) - Math.sin(progress * Math.PI) * 132;

    if (progress >= 1) {
      enemy.mode = "formation";
      enemy.attack = null;
      enemy.bombCooldown = rand(settings.bombMin, settings.bombMax);
    }
  }
}

function updateEnemies(dt) {
  if (!game.enemies.some((enemy) => enemy.alive)) {
    nextLevel();
    return;
  }

  const now = performance.now() / 1000;
  const settings = getLevelSettings(game.level);

  updateFormation(dt);

  if (!hasActiveAttackers()) {
    game.cycleTimer -= dt;
    if (game.cycleTimer <= 0 && game.state === STATE.PLAYING) {
      pickAttackGroup();
    }
  }

  for (const enemy of game.enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.mode === "formation") {
      enemy.x = enemy.baseX + game.formationOffsetX;
      enemy.y = enemy.baseY + Math.sin(now * 2 + enemy.hoverPhase + enemy.col * 0.25) * 4;
      continue;
    }

    if (enemy.mode === "queued") {
      enemy.x = enemy.baseX + game.formationOffsetX;
      enemy.y = enemy.baseY + Math.sin(now * 2 + enemy.hoverPhase + enemy.col * 0.25) * 4;
      enemy.launchDelay = Math.max(0, enemy.launchDelay - dt);
      if (enemy.launchDelay === 0) {
        enemy.mode = "launching";
        enemy.attack.phaseTime = 0;
        enemy.attack.startX = enemy.x;
        enemy.attack.startY = enemy.y;
      }
      continue;
    }

    updateAttackingEnemy(enemy, dt, now, settings);
  }
}

function handleCollisions() {
  for (const bullet of game.bullets) {
    for (const enemy of game.enemies) {
      if (!enemy.alive) {
        continue;
      }

      if (isColliding(bullet, enemy)) {
        enemy.alive = false;
        bullet.hit = true;
        game.score += enemy.scoreValue + (enemy.mode === "formation" ? 0 : 60);
        break;
      }
    }
  }

  for (const bullet of game.enemyBullets) {
    if (game.player.hitTimer > 0) {
      continue;
    }

    if (isColliding(bullet, game.player)) {
      bullet.hit = true;
      handlePlayerHit();
    }
  }

  for (const enemy of game.enemies) {
    if (!enemy.alive || game.player.hitTimer > 0) {
      continue;
    }

    if (isColliding(enemy, game.player)) {
      enemy.alive = false;
      handlePlayerHit();
    }
  }

  game.bullets = game.bullets.filter((bullet) => !bullet.hit);
  game.enemyBullets = game.enemyBullets.filter((bullet) => !bullet.hit);
}

function update(dt) {
  updateStars(dt);
  game.overlayFlash = Math.max(0, game.overlayFlash - dt * 0.8);
  game.levelBannerTimer = Math.max(0, game.levelBannerTimer - dt);

  if (game.state !== STATE.PLAYING) {
    return;
  }

  updatePlayer(dt);
  updateBullets(dt);
  updateEnemies(dt);
  handleCollisions();
}

function drawStars() {
  for (const star of game.stars) {
    ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  if (!game.player) {
    return;
  }

  const { x, y, width, height, hitTimer } = game.player;
  const flicker = hitTimer > 0 && Math.floor(hitTimer * 20) % 2 === 0;
  if (flicker) {
    return;
  }

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "#7cf5ff";
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(width / 2 + 6, height - 4);
  ctx.lineTo(width / 2, height - 12);
  ctx.lineTo(width / 2 - 6, height - 4);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffd166";
  ctx.fillRect(width / 2 - 3, height - 10, 6, 10);

  ctx.restore();
}

function drawEnemy(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  const body = enemy.row === 0 ? "#ff5d8f" : enemy.row <= 1 ? "#7cff98" : "#ffc84f";
  const wing = enemy.row === 0 ? "#ff8fb1" : enemy.row <= 1 ? "#b6ff65" : "#ffe083";
  const cockpit = enemy.row === 0 ? "#72f4ff" : "#7de8ff";
  const modeScale = enemy.mode !== "formation" && enemy.mode !== "queued" ? 1.08 : 1;
  ctx.scale(modeScale, modeScale);

  if (enemy.row === 0) {
    ctx.fillStyle = wing;
    ctx.beginPath();
    ctx.moveTo(3, 13);
    ctx.lineTo(0, 5);
    ctx.lineTo(7, 8);
    ctx.lineTo(11, 3);
    ctx.lineTo(14, 11);
    ctx.lineTo(17, 3);
    ctx.lineTo(21, 8);
    ctx.lineTo(28, 5);
    ctx.lineTo(25, 13);
    ctx.lineTo(19, 16);
    ctx.lineTo(14, 22);
    ctx.lineTo(9, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(10, 3);
    ctx.lineTo(18, 3);
    ctx.lineTo(22, 10);
    ctx.lineTo(18, 18);
    ctx.lineTo(10, 18);
    ctx.lineTo(6, 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = cockpit;
    ctx.fillRect(11, 7, 6, 4);
    ctx.fillRect(8, 12, 3, 5);
    ctx.fillRect(17, 12, 3, 5);
  } else if (enemy.row <= 1) {
    ctx.fillStyle = wing;
    ctx.beginPath();
    ctx.moveTo(1, 12);
    ctx.lineTo(6, 5);
    ctx.lineTo(11, 8);
    ctx.lineTo(14, 1);
    ctx.lineTo(17, 8);
    ctx.lineTo(22, 5);
    ctx.lineTo(27, 12);
    ctx.lineTo(21, 15);
    ctx.lineTo(18, 21);
    ctx.lineTo(10, 21);
    ctx.lineTo(7, 15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(9, 4);
    ctx.lineTo(19, 4);
    ctx.lineTo(22, 11);
    ctx.lineTo(18, 19);
    ctx.lineTo(10, 19);
    ctx.lineTo(6, 11);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = cockpit;
    ctx.fillRect(11, 8, 6, 4);
    ctx.fillRect(13, 13, 2, 5);
  } else {
    ctx.fillStyle = wing;
    ctx.beginPath();
    ctx.moveTo(2, 13);
    ctx.lineTo(0, 8);
    ctx.lineTo(6, 8);
    ctx.lineTo(10, 2);
    ctx.lineTo(14, 9);
    ctx.lineTo(18, 2);
    ctx.lineTo(22, 8);
    ctx.lineTo(28, 8);
    ctx.lineTo(26, 13);
    ctx.lineTo(20, 16);
    ctx.lineTo(17, 22);
    ctx.lineTo(11, 22);
    ctx.lineTo(8, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(10, 4);
    ctx.lineTo(18, 4);
    ctx.lineTo(21, 12);
    ctx.lineTo(18, 19);
    ctx.lineTo(10, 19);
    ctx.lineTo(7, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = cockpit;
    ctx.fillRect(11, 8, 6, 4);
    ctx.fillRect(9, 13, 2, 4);
    ctx.fillRect(17, 13, 2, 4);
  }

  if (enemy.mode !== "formation" && enemy.mode !== "queued") {
    ctx.strokeStyle = "rgba(117, 243, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.width / 2, enemy.height / 2, enemy.width / 2 + 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 209, 102, 0.85)";
    ctx.beginPath();
    ctx.moveTo(enemy.width / 2 - 4, enemy.height - 1);
    ctx.lineTo(enemy.width / 2, enemy.height + 10);
    ctx.lineTo(enemy.width / 2 + 4, enemy.height - 1);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#09111f";
  ctx.fillRect(8, 9, 3, 3);
  ctx.fillRect(enemy.width - 11, 9, 3, 3);

  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(5, enemy.height - 5);
  ctx.lineTo(1, enemy.height + 3);
  ctx.moveTo(enemy.width - 5, enemy.height - 5);
  ctx.lineTo(enemy.width - 1, enemy.height + 3);
  ctx.stroke();

  ctx.restore();
}

function drawBullets() {
  ctx.fillStyle = "#ffd166";
  for (const bullet of game.bullets) {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }

  ctx.fillStyle = "#ff8fab";
  for (const bullet of game.enemyBullets) {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }
}

function drawHud() {
  const fleetCount = game.enemies.filter((enemy) => enemy.alive).length;

  ctx.fillStyle = "#dfe7ff";
  ctx.font = '700 22px "Trebuchet MS", sans-serif';
  ctx.fillText(`Score ${game.score}`, 24, 36);
  ctx.fillText(`Lives ${game.lives}`, 24, 66);
  ctx.fillText(`Fleet ${fleetCount}`, 24, 96);
  ctx.fillText(`Level ${game.level}`, game.width - 120, 36);

  for (let i = 0; i < game.lives; i += 1) {
    const shipX = game.width - 32 - i * 22;
    const shipY = 72;
    ctx.fillStyle = "#7cf5ff";
    ctx.beginPath();
    ctx.moveTo(shipX + 8, shipY);
    ctx.lineTo(shipX + 16, shipY + 14);
    ctx.lineTo(shipX + 8, shipY + 10);
    ctx.lineTo(shipX, shipY + 14);
    ctx.closePath();
    ctx.fill();
  }
}

function drawLevelBanner() {
  if (game.levelBannerTimer <= 0 || game.state !== STATE.PLAYING) {
    return;
  }

  const alpha = Math.min(1, game.levelBannerTimer / 1.6);
  ctx.fillStyle = `rgba(2, 4, 11, ${0.32 * alpha})`;
  ctx.fillRect(game.width / 2 - 120, 18, 240, 44);

  ctx.textAlign = "center";
  ctx.fillStyle = `rgba(117, 243, 255, ${alpha})`;
  ctx.font = '700 24px "Trebuchet MS", sans-serif';
  ctx.fillText(`Wave ${game.level}`, game.width / 2, 47);
  ctx.textAlign = "start";
}

function drawOverlay() {
  if (game.overlayFlash > 0) {
    ctx.fillStyle = `rgba(255, 99, 132, ${game.overlayFlash})`;
    ctx.fillRect(0, 0, game.width, game.height);
  }

  if (game.state === STATE.PLAYING) {
    drawLevelBanner();
    return;
  }

  ctx.fillStyle = "rgba(2, 4, 11, 0.74)";
  ctx.fillRect(0, 0, game.width, game.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#f6f7fb";
  ctx.font = '700 52px "Trebuchet MS", sans-serif';
  ctx.fillText(game.state === STATE.GAME_OVER ? "Game Over" : "Star Swarm", game.width / 2, 220);

  ctx.fillStyle = "#9eb2d0";
  ctx.font = '400 24px "Trebuchet MS", sans-serif';
  if (game.state === STATE.GAME_OVER) {
    ctx.fillText(`Final Score ${game.score}`, game.width / 2, 270);
    ctx.fillText("Press Enter to launch a new run", game.width / 2, 320);
  } else {
    ctx.fillText("Fleet attack cycles with looping bomber runs", game.width / 2, 280);
    ctx.fillText("Press Enter to start", game.width / 2, 320);
  }

  ctx.fillStyle = "#75f3ff";
  ctx.font = '400 18px "Trebuchet MS", sans-serif';
  ctx.fillText("Move with Left / Right or A / D. Fire with Space.", game.width / 2, 380);
  ctx.textAlign = "start";
}

function render() {
  ctx.clearRect(0, 0, game.width, game.height);
  drawStars();
  drawBullets();

  for (const enemy of game.enemies) {
    if (enemy.alive) {
      drawEnemy(enemy);
    }
  }

  drawPlayer();
  drawHud();
  drawOverlay();
}

function loop(timestamp) {
  const delta = Math.min(0.033, (timestamp - game.lastTime) / 1000 || 0);
  game.lastTime = timestamp;
  update(delta);
  render();
  requestAnimationFrame(loop);
}

function setKeyState(key, pressed) {
  if (key === "ArrowLeft" || key.toLowerCase() === "a") {
    input.left = pressed;
  }

  if (key === "ArrowRight" || key.toLowerCase() === "d") {
    input.right = pressed;
  }

  if (key === " " || key === "Spacebar") {
    input.fire = pressed;
  }
}

window.addEventListener("keydown", (event) => {
  if (
    ["ArrowLeft", "ArrowRight", " ", "Enter"].includes(event.key) ||
    ["a", "A", "d", "D"].includes(event.key)
  ) {
    event.preventDefault();
  }

  if (event.key === "Enter" && game.state !== STATE.PLAYING) {
    startGame();
  }

  setKeyState(event.key, true);
});

window.addEventListener("keyup", (event) => {
  setKeyState(event.key, false);
});

resetGame();
requestAnimationFrame(loop);
