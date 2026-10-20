/* ====== TÙY CHỈNH LỜI CHÚC Ở ĐÂY ======
   Hoặc dùng link: index.html?ten=Mai&tu=Minh                */
const CONFIG = {
  recipient: 'cậu',
  sender: 'Bạn của cậu',
  // Mỗi lần mở thư sẽ ngẫu nhiên hiện một lời chúc trong danh sách này.
  // Thêm lời chúc mới: thêm một dòng. Muốn xuống dòng trong một lời chúc, dùng \n.
  messages: [
    'Hôm nay là ngày của các bạn. Vì vậy hãy gác lại bộn bề, làm những gì mình thích nhé. Chúc các bạn có một ngày thật tuyệt vời.',
    'Hãy luôn xinh đẹp, hạnh phúc và đừng bao giờ bỏ cuộc. Cuộc sống này sẽ luôn nhẹ nhàng với cậu thôi. Chúc cậu ngày 20/10 vui vẻ!',
    'Chúc cậu không chỉ hôm nay mà 364 ngày sau lúc nào cũng ngập tràn tiếng cười và vui vẻ như thế này nhé.',
    'Nhân dịp 20/10, chúc cậu sẽ có một ngày thật tuyệt vời, xinh đẹp và vui vẻ.'
  ]
};

const params = new URLSearchParams(location.search);
if (params.get('ten')) CONFIG.recipient = params.get('ten');
if (params.get('tu'))  CONFIG.sender = params.get('tu');

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const scene = $('scene'), envelope = $('envelope'), seal = $('seal');
const statusEl = $('status'), fill = $('fill');
const wrap = $('wrap'), card = $('card'), msg = $('msg');

/* ---------- Nhạc nền ---------- */
const bgm = $('bgm'), musicBtn = $('music');
const MUSIC_VOLUME = 0.6;
let fadeTimer;

function setMusicUI(on) {
  musicBtn.setAttribute('aria-pressed', on);
  musicBtn.textContent = on ? 'Tắt nhạc' : 'Bật nhạc';
}
function playMusic() {
  bgm.volume = 0;
  bgm.play().then(() => {
    setMusicUI(true);
    clearInterval(fadeTimer);
    fadeTimer = setInterval(() => {            // nhạc nhỏ dần vào trong ~2 giây
      bgm.volume = Math.min(MUSIC_VOLUME, bgm.volume + 0.03);
      if (bgm.volume >= MUSIC_VOLUME) clearInterval(fadeTimer);
    }, 100);
  }).catch(() => setMusicUI(false));
}
musicBtn.addEventListener('click', () => {
  if (bgm.paused) playMusic();
  else { bgm.pause(); setMusicUI(false); }
});

/* ---------- 1. Loading ---------- */
let progress = 0, loaded = false;

function load() {
  progress = Math.min(100, progress + Math.random() * 6 + 1);
  fill.style.width = progress + '%';
  statusEl.textContent =
    progress < 35 ? 'Đang gói lời chúc…' :
    progress < 70 ? 'Đang dán tem…' :
    progress < 100 ? 'Sắp đến nơi rồi…' : 'Có một lá thư dành cho bạn';
  if (progress < 100) setTimeout(load, 120);
  else ready();
}

function ready() {
  loaded = true;
  seal.disabled = false;
  seal.classList.add('ready');
  seal.focus({ preventScroll: true });
}

/* ---------- 2. Mở thư ---------- */
seal.addEventListener('click', openLetter);

async function openLetter() {
  if (!loaded) return;
  seal.disabled = true;
  playMusic();                                  // bấm mở thư mới được phát nhạc (quy định của trình duyệt)
  envelope.classList.add('opened');
  statusEl.textContent = 'Đang mở thư…';
  startPetals();
  await sleep(reduce ? 100 : 1900);
  scene.classList.add('gone');
  wrap.classList.add('show');
  await sleep(reduce ? 0 : 700);
  typeMessage();
}

/* ---------- 3. Gõ lời chúc (bấm vào thư để hiện nhanh) ---------- */
let skip = false, runId = 0, lastMsg = -1;

function pickMessage() {                        // chọn ngẫu nhiên, không lặp lại lời chúc vừa hiện
  let i;
  do { i = Math.floor(Math.random() * CONFIG.messages.length); }
  while (i === lastMsg && CONFIG.messages.length > 1);
  lastMsg = i;
  return CONFIG.messages[i].split('\n');
}
card.addEventListener('click', e => { if (e.target.id !== 'again') skip = true; });

async function typeMessage() {
  const id = ++runId;
  skip = reduce;
  msg.innerHTML = '';
  $('greet').textContent = `Gửi ${CONFIG.recipient},`;
  $('sign').textContent = `Thân gửi,\n${CONFIG.sender}`;
  card.classList.remove('done');

  for (const text of pickMessage()) {
    const p = document.createElement('p');
    p.className = 'typing';
    msg.append(p);
    for (const ch of text) {
      if (skip) { p.textContent = text; break; }
      p.textContent += ch;
      await sleep(ch === '.' || ch === ',' ? 160 : 26);
      if (id !== runId) return;
    }
    p.classList.remove('typing');
    if (!skip) await sleep(300);
  }
  card.classList.add('done');
}

$('again').addEventListener('click', () => {
  runId++;
  wrap.classList.remove('show');
  scene.classList.remove('gone');
  envelope.classList.remove('opened');
  statusEl.textContent = 'Có một lá thư dành cho bạn';
  seal.disabled = false;
  seal.focus({ preventScroll: true });
});

/* ---------- 4. Cánh hoa rơi + hoa nở khi bấm ---------- */
const cv = $('petals'), cx = cv.getContext('2d');
const COLORS = ['#e8b4b8', '#f2cfcf', '#d9a3a8', '#e6d3b8'];
let W, H, petals = [], blooms = [], bursts = [], petalsOn = false;

function resize() {
  const d = devicePixelRatio || 1;
  W = innerWidth; H = innerHeight;
  cv.width = W * d; cv.height = H * d;
  cx.setTransform(d, 0, 0, d, 0, 0);
}
addEventListener('resize', resize);
resize();

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function petalPath(r) {                         // hình cánh hoa dài 2r
  cx.beginPath();
  cx.moveTo(0, -r);
  cx.bezierCurveTo(r, -r * .6, r * .8, r * .8, 0, r);
  cx.bezierCurveTo(-r * .8, r * .8, -r, -r * .6, 0, -r);
  cx.fill();
}

/* cánh hoa rơi nền (sau khi mở thư) */
function makePetal(initial) {
  return {
    x: Math.random() * W, y: initial ? -Math.random() * H : -20,
    r: 5 + Math.random() * 5, vy: .6 + Math.random() * 1.2,
    vx: -.3 + Math.random() * .6, rot: Math.random() * 6.28,
    vr: (Math.random() - .5) * .04, ph: Math.random() * 6.28, c: pick(COLORS)
  };
}
function drawPetals() {
  for (const p of petals) {
    p.ph += .03; p.x += p.vx + Math.sin(p.ph) * .6; p.y += p.vy; p.rot += p.vr;
    if (p.y > H + 20) Object.assign(p, makePetal(false));
    cx.save();
    cx.translate(p.x, p.y); cx.rotate(p.rot);
    cx.scale(1, Math.abs(Math.cos(p.ph)) * .5 + .5);
    cx.fillStyle = p.c; cx.globalAlpha = .75;
    petalPath(p.r);
    cx.restore();
  }
}
function startPetals() {
  if (petalsOn || reduce) return;
  petalsOn = true;
  const n = W < 600 ? 12 : 20;
  for (let i = 0; i < n; i++) petals.push(makePetal(true));
}

/* hoa nở tại chỗ bấm */
const easeOutBack = x => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);

function addBloom(x, y) {
  if (blooms.length > 12) blooms.shift();
  blooms.push({ x, y, t: 0, rot: Math.random() * 6.28, n: 5 + Math.floor(Math.random() * 2),
                size: 34 + Math.random() * 16, c: pick(COLORS) });
  for (let i = 0; i < 7; i++) {                 // vài cánh hoa bung ra xung quanh
    const a = Math.random() * 6.28, s = 1.5 + Math.random() * 2.2;
    bursts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, r: 3 + Math.random() * 3,
                  rot: Math.random() * 6.28, vr: (Math.random() - .5) * .2, life: 1, c: pick(COLORS) });
  }
}
function drawBlooms() {
  blooms = blooms.filter(b => b.t < 1);
  for (const b of blooms) {
    b.t += 1 / 70;                              // ~1,1 giây
    const k = easeOutBack(Math.min(1, b.t / .5));
    const alpha = b.t < .6 ? 1 : 1 - (b.t - .6) / .4;
    cx.save();
    cx.translate(b.x, b.y); cx.rotate(b.rot + b.t * .6);
    cx.fillStyle = b.c; cx.globalAlpha = Math.max(0, alpha) * .85;
    for (let i = 0; i < b.n; i++) {
      cx.save();
      cx.rotate(i * 6.2832 / b.n);
      cx.translate(0, -b.size * .5 * k);
      petalPath(b.size * .5 * k);
      cx.restore();
    }
    cx.fillStyle = '#f3e2c0';
    cx.beginPath(); cx.arc(0, 0, b.size * .14 * k, 0, 6.2832); cx.fill();
    cx.restore();
  }
  bursts = bursts.filter(p => p.life > 0);
  for (const p of bursts) {
    p.x += p.vx; p.y += p.vy; p.vy += .06; p.vx *= .985; p.rot += p.vr; p.life -= .018;
    cx.save();
    cx.translate(p.x, p.y); cx.rotate(p.rot);
    cx.fillStyle = p.c; cx.globalAlpha = Math.max(0, p.life) * .8;
    petalPath(p.r);
    cx.restore();
  }
}

function frame() {
  cx.clearRect(0, 0, W, H);
  drawPetals();
  drawBlooms();
  requestAnimationFrame(frame);
}

/* Hoa nở do người xem tự bấm nên luôn bật (kể cả khi thiết bị đặt "giảm chuyển động");
   chỉ cánh hoa rơi tự động mới tắt trong chế độ đó. */
requestAnimationFrame(frame);
const bloomAt = (x, y) => addBloom(x, y);
if (window.PointerEvent) {
  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('button')) bloomAt(e.clientX, e.clientY);
  }, true);
} else {                                        // trình duyệt cũ
  document.addEventListener('mousedown', e => {
    if (!e.target.closest('button')) bloomAt(e.clientX, e.clientY);
  }, true);
  document.addEventListener('touchstart', e => {
    const t = e.touches[0];
    if (t && !e.target.closest('button')) bloomAt(t.clientX, t.clientY);
  }, true);
}

/* ---------- Khởi động ---------- */
setTimeout(load, 600);
