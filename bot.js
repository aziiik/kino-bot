const { Telegraf, Markup } = require('telegraf');
const Database = require('better-sqlite3');
const bot = new Telegraf('8348798186:AAEMqMzk7NbeSYZQgAs9g1O_QNsMhL2xQTs');   // ← tokeningizni qo‘ying

// ================= DATABASE =================
const db = new Database('movies.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    code TEXT PRIMARY KEY,
    title TEXT,
    file_id TEXT,
    views INTEGER DEFAULT 0,
    likes TEXT DEFAULT '[]'
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY,
    username TEXT
  );
`);

// ================= YORDAMCHI FUNKSIYALAR =================
const isAdmin = (id) => admins.includes(id);   // pastda admins ni saqlaymiz
const isSupport = (id) => supports.includes(id);
const isStaff = (id) => isAdmin(id) || isSupport(id);

// Adminlar ro‘yxati (o‘zgartiring)
let admins = [YOUR_ID]; 
let supports = [];

// ================= START =================
// bot.start((ctx) => { ... }); // bu qismini o‘zgartirmadim, o‘zingiz qoldiring

// ================= KINO QO‘SHISH (Video) =================
bot.on('video', (ctx) => {
  const userId = ctx.from.id;
  if (!isStaff(userId)) return;

  const stateData = state[userId];
  if (!stateData || stateData.step !== 'video') return;

  const insert = db.prepare(`
    INSERT OR REPLACE INTO movies (code, title, file_id) 
    VALUES (?, ?, ?)
  `);

  insert.run(stateData.code, stateData.title, ctx.message.video.file_id);

  delete state[userId];
  ctx.reply("✅ Kino muvaffaqiyatli qo‘shildi!");
});

// ================= TEXT (Kod yuborilganda) =================
bot.on('text', (ctx) => {
  const text = ctx.message.text.trim();
  const userId = ctx.from.id;

  // ... oldingi button va admin logikangiz qolsin ...

  // Kino izlash
  const movieStmt = db.prepare("SELECT * FROM movies WHERE code = ?");
  const movie = movieStmt.get(text);

  if (movie) {
    let likes = [];
    try { likes = JSON.parse(movie.likes); } catch(e) {}

    movie.views = (movie.views || 0) + 1;

    // views ni yangilash
    db.prepare("UPDATE movies SET views = ? WHERE code = ?")
      .run(movie.views, text);

    const percent = likes.length > 0 
      ? Math.round((likes.length / movie.views) * 100) 
      : 0;

    ctx.replyWithVideo(movie.file_id, {
      caption: `🎬 ${movie.title}\n👁 ${movie.views} ta ko‘rish\n👍 ${percent}% like`,
      ...Markup.inlineKeyboard([
        [Markup.button.callback("👍 Like", `like_${movie.code}`)]
      ])
    });
    return;
  }

  // Agar kod topilmasa
  ctx.reply("❌ Bunday kod topilmadi.");
});

// ================= LIKE =================
bot.action(/like_(.+)/, (ctx) => {
  const code = ctx.match[1];
  const userId = ctx.from.id;

  const movie = db.prepare("SELECT likes FROM movies WHERE code = ?").get(code);
  if (!movie) return ctx.answerCbQuery("Kino topilmadi");

  let likes = [];
  try { likes = JSON.parse(movie.likes); } catch(e) {}

  if (likes.includes(userId)) {
    return ctx.answerCbQuery("Siz allaqachon like bosgansiz!");
  }

  likes.push(userId);

  db.prepare("UPDATE movies SET likes = ? WHERE code = ?")
    .run(JSON.stringify(likes), code);

  ctx.answerCbQuery("👍 Like qabul qilindi");
});

// ================= ADMIN: KINO QO‘SHISH (state) =================
// bot.command('admin', (ctx) => { ... }); // o‘zingizniki qolsin

// Kino qo‘shish jarayoni (state)
let state = {};

bot.on('text', (ctx) => {
  // ... oldingi state logikasi ...

  if (state[userId]?.step === 'code') {
    state[userId].code = text;
    state[userId].step = 'title';
    return ctx.reply("Kino nomini yozing:");
  }

  if (state[userId]?.step === 'title') {
    state[userId].title = text;
    state[userId].step = 'video';
    return ctx.reply("Endi kinoni video sifatida yuboring:");
  }
  // qolgan qismlar...
});

bot.launch();
console.log("✅ Bot ishga tushdi!");