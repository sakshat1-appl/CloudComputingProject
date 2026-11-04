// Simple Flappy Bird + cloud sync (fetch -> Flask API)
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

// Bird sprite assets (2-frame flap) - falls back to circle if not loaded yet
const birdImg = new Image();
const birdImgFlap = new Image();
let birdReady = 0;
birdImg.onload = () => birdReady++;
birdImgFlap.onload = () => birdReady++;
birdImg.src = "/static/bird.svg";
birdImgFlap.src = "/static/bird-flap.svg";

let bird, pipes, score, running, dead, frame;

function reset() {
  bird = { x: 80, y: 250, vy: 0, r: 12 };
  pipes = [];
  score = 0;
  frame = 0;
  dead = false;
  running = true;
  document.getElementById("msg").textContent = "Playing... Space / Click to flap!";
}

function flap() {
  if (!running || dead) return;
  bird.vy = -6;
}

function update() {
  if (!running || dead) return;
  frame++;
  bird.vy += 0.28;
  bird.y += bird.vy;

  if (frame % 90 === 0) {
    const gap = 130, top = Math.random() * (H - gap - 120) + 40;
    pipes.push({ x: W, top: top, gap: gap, w: 60, passed: false });
  }
  for (const p of pipes) {
    p.x -= 2.2;
    if (!p.passed && p.x + p.w < bird.x) { p.passed = true; score++; }
  }
  pipes = pipes.filter(p => p.x + p.w > 0);

  // collisions
  if (bird.y + bird.r >= H || bird.y - bird.r <= 0) return gameOver();
  for (const p of pipes) {
    if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + p.w) {
      if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + p.gap) return gameOver();
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  // bird (sprite asset, tilts with velocity + flaps wings)
  if (birdReady >= 2) {
    const img = (running && !dead && Math.floor(frame / 8) % 2 === 0) ? birdImgFlap : birdImg;
    const tilt = Math.max(-0.4, Math.min(0.6, bird.vy * 0.06));
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(tilt);
    ctx.drawImage(img, -20, -15, 40, 30);
    ctx.restore();
  } else {
    ctx.fillStyle = "#ffeb3b";
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#333"; ctx.stroke();
  }
  // pipes
  ctx.fillStyle = "#4caf50";
  for (const p of pipes) {
    ctx.fillRect(p.x, 0, p.w, p.top);
    ctx.fillRect(p.x, p.top + p.gap, p.w, H - p.top - p.gap);
  }
  ctx.fillStyle = "#000";
  ctx.font = "28px Arial";
  ctx.fillText("Score: " + score, 12, 34);
  if (dead) {
    ctx.font = "30px Arial";
    ctx.fillText("Game Over!", 110, H / 2);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

async function gameOver() {
  if (dead) return;
  dead = true;
  running = false;
  const player = document.getElementById("player").value.trim() || "Anonymous";
  document.getElementById("msg").textContent = `Game Over! Score ${score} - saving to cloud...`;
  try {
    await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player, score })
    });
    document.getElementById("msg").textContent = `Game Over! Score ${score} saved to cloud.`;
  } catch (e) {
    document.getElementById("msg").textContent = `Game Over! Score ${score} (cloud save failed - offline?)`;
  }
  refreshBoard();
}

async function refreshBoard() {
  try {
    const [b, s] = await Promise.all([
      fetch("/api/leaderboard?limit=10").then(r => r.json()),
      fetch("/api/stats").then(r => r.json())
    ]);
    const ol = document.getElementById("board");
    ol.innerHTML = b.length ? "" : "<li>No scores yet - play!</li>";
    b.forEach((e, i) => {
      const li = document.createElement("li");
      li.textContent = `${e.player}: best ${e.best} (games ${e.games}, avg ${e.avg})`;
      ol.appendChild(li);
    });
    document.getElementById("stats").textContent =
      `total_games: ${s.total_games}\nunique_players: ${s.unique_players}\noverall_max: ${s.overall_max}\noverall_avg: ${s.overall_avg}`;
  } catch (e) { /* offline - ignore */ }
}

document.getElementById("startBtn").onclick = reset;
window.addEventListener("keydown", e => { if (e.code === "Space") { e.preventDefault(); flap(); } });
canvas.addEventListener("click", flap);

reset();
running = false; // wait for Start press
document.getElementById("msg").textContent = "Press Start, then Space or Click.";
loop();
refreshBoard();
setInterval(refreshBoard, 5000);
