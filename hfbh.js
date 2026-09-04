const game = (() => {
  if (typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = 480;
  const height = 640;

  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'block';
  canvas.style.margin = '20px auto';
  canvas.style.background = '#0f172a';
  canvas.style.border = '4px solid #38bdf8';
  canvas.style.borderRadius = '12px';
  canvas.style.boxShadow = '0 0 20px rgba(56, 189, 248, 0.35)';

  const root = document.querySelector('.game-frame') || document.body || document.documentElement;
  const startModal = document.querySelector('.start-modal');
  const startButton = document.querySelector('.start-button');
  root.appendChild(canvas);

  const state = {
    keys: { left: false, right: false },
    player: {
      x: width / 2 - 40,
      y: height - 22,
      width: 80,
      height: 16,
      speed: 360,
    },
    bullets: [],
    enemies: [],
    stars: [],
    score: 0,
    highScore: Number(localStorage.getItem('simple-game-high-score') || 0),
    started: false,
    running: false,
    lastTime: 0,
    spawnTimer: 0,
  };

  const rand = (min, max) => Math.random() * (max - min) + min;

  function createEnemy() {
    const radius = rand(8, 14);
    state.enemies.push({
      x: rand(radius, width - radius),
      y: -20,
      radius,
      speed: rand(120, 220),
      color: `hsl(${rand(0, 360)}, 80%, 60%)`,
    });
  }

  function createStar() {
    return {
      x: rand(0, width),
      y: rand(0, height),
      r: rand(1, 3),
      speed: rand(20, 60),
      alpha: rand(0.3, 1),
    };
  }

  function resetGame() {
    state.player.x = width / 2 - 40;
    state.player.y = height - 22;
    state.bullets = [];
    state.enemies = [];
    state.stars = Array.from({ length: 60 }, createStar);
    state.score = 0;
    state.running = state.started;
    state.spawnTimer = 0;
  }

  function startGame() {
    state.started = true;
    resetGame();
    if (startModal) startModal.hidden = true;
  }

  function shoot() {
    if (!state.running) return;
    state.bullets.push({
      x: state.player.x + state.player.width / 2 - 2,
      y: state.player.y - 12,
      width: 4,
      height: 12,
      speed: 420,
    });
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      state.keys.left = true;
    }
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      state.keys.right = true;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      if (!state.started) {
        startGame();
        return;
      }
      if (!state.running) {
        resetGame();
      } else {
        shoot();
      }
    }
  }

  function onKeyUp(event) {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      state.keys.left = false;
    }
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      state.keys.right = false;
    }
  }

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  if (startButton) startButton.addEventListener('click', startGame);

  function update(dt) {
    if (!state.running) return;

    if (state.keys.left) {
      state.player.x -= state.player.speed * dt;
    }
    if (state.keys.right) {
      state.player.x += state.player.speed * dt;
    }
    state.player.x = Math.max(0, Math.min(width - state.player.width, state.player.x));

    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      createEnemy();
      state.spawnTimer = Math.max(0.4, 1.15 - state.score * 0.02);
    }

    for (const bullet of state.bullets) {
      bullet.y -= bullet.speed * dt;
    }
    state.bullets = state.bullets.filter((b) => b.y + b.height > 0);

    for (const enemy of state.enemies) {
      enemy.y += enemy.speed * dt;
    }

    for (const star of state.stars) {
      star.y += star.speed * dt;
      if (star.y > height + 5) {
        star.y = -5;
        star.x = rand(0, width);
      }
    }

    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const enemy = state.enemies[i];
      const hit =
        state.player.x < enemy.x + enemy.radius &&
        state.player.x + state.player.width > enemy.x - enemy.radius &&
        state.player.y < enemy.y + enemy.radius &&
        state.player.y + state.player.height > enemy.y - enemy.radius;

      if (hit) {
        state.running = false;
        state.highScore = Math.max(state.highScore, state.score);
        localStorage.setItem('simple-game-high-score', String(state.highScore));
        break;
      }

      for (let j = state.bullets.length - 1; j >= 0; j--) {
        const bullet = state.bullets[j];
        const bulletHit =
          bullet.x < enemy.x + enemy.radius &&
          bullet.x + bullet.width > enemy.x - enemy.radius &&
          bullet.y < enemy.y + enemy.radius &&
          bullet.y + bullet.height > enemy.y - enemy.radius;

        if (bulletHit) {
          state.enemies.splice(i, 1);
          state.bullets.splice(j, 1);
          state.score += 10;
          break;
        }
      }

      if (enemy.y - enemy.radius > state.player.y + state.player.height) {
        state.running = false;
        state.highScore = Math.max(state.highScore, state.score);
        localStorage.setItem('simple-game-high-score', String(state.highScore));
        break;
      }
    }

    state.enemies = state.enemies.filter((enemy) => enemy.y < height + 40);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (const star of state.stars) {
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#f8fafc';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Score: ${state.score}`, 16, 28);
    ctx.fillText(`Best: ${state.highScore}`, width - 120, 28);

    if (!state.started) return;

    if (state.running) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);

      for (const bullet of state.bullets) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      }

      for (const enemy of state.enemies) {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '22px sans-serif';
      ctx.fillText(`Final Score: ${state.score}`, width / 2, height / 2 + 20);
      ctx.fillText('Press Space or Enter to play again', width / 2, height / 2 + 60);
      ctx.textAlign = 'left';
    }

    if (!state.running) return;

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px sans-serif';
    ctx.fillText('Move: A/D or arrows • Fire: Space', 16, height - 16);
  }

  function frame(timestamp) {
    const dt = Math.min((timestamp - state.lastTime) / 1000 || 0.016, 0.033);
    state.lastTime = timestamp;

    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  resetGame();
  for (let i = 0; i < 40; i++) state.stars.push(createStar());
  requestAnimationFrame(frame);
})();
