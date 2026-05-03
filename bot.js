require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ===== JSON =====
function loadData() {
  return JSON.parse(fs.readFileSync('data.json'));
}
function saveData(data) {
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
}

// ===== STATE =====
let state = {};

// ===== ROLE =====
function isAdmin(id) {
  return loadData().admins.includes(id);
}
function isSupport(id) {
  return loadData().supports.includes(id);
}
function isStaff(id) {
  return isAdmin(id) || isSupport(id);
}

// ===== USER SAVE =====
bot.use((ctx, next) => {
  let data = loadData();
  let id = ctx.from.id;

  if (!data.users.includes(id)) {
    data.users.push(id);
    saveData(data);
  }
  return next();
});

// ===== START =====
bot.start((ctx) => {
  ctx.reply("🎬 Kino botga xush kelibsiz!\nKod yuboring:");
});

// ===== ADMIN PANEL =====
bot.command('admin', (ctx) => {
  if (!isStaff(ctx.from.id)) return ctx.reply("❌ Ruxsat yo‘q");

  ctx.reply("⚙️ Panel:", Markup.keyboard([
    ['➕ Kino qo‘shish','❌ Kino o‘chirish'],
    ['📢 Xabar yuborish','📊 Statistika'],
    ['👑 Admin qo‘shish','❌ Admin o‘chirish'],
    ['🛠 Support qo‘shish','🚫 Support o‘chirish']
  ]).resize());
});

// ===== TEXT =====
bot.on('text', async (ctx) => {
  let id = ctx.from.id;
  let text = ctx.message.text;
  let data = loadData();

  // ===== PANEL BUTTONS =====
  if (text === '➕ Kino qo‘shish') {
    if (!isStaff(id)) return;
    state[id] = { step: 'code' };
    return ctx.reply("🎬 Kino kodi:");
  }

  if (text === '❌ Kino o‘chirish') {
    if (!isStaff(id)) return;
    state[id] = { step: 'del_movie' };
    return ctx.reply("❗ O‘chiriladigan kino kodini yubor:");
  }

  if (text === '📢 Xabar yuborish') {
    if (!isStaff(id)) return;
    state[id] = { step: 'broadcast' };
    return ctx.reply("✍️ Xabar yoz:");
  }

  if (text === '📊 Statistika') {
    let totalLikes = data.movies.reduce((a,m)=>a + m.likes.length,0);

    let topView = [...data.movies].sort((a,b)=>b.views-a.views)[0];
    let topLike = [...data.movies].sort((a,b)=>b.likes.length-a.likes.length)[0];

    return ctx.reply(`📊 BOT STATISTIKASI

👥 Foydalanuvchilar: ${data.users.length}
🎬 Kinolar soni: ${data.movies.length}
👍 Umumiy like: ${totalLikes}

🔥 Eng ko‘p ko‘rilgan:
${topView ? topView.title + " (" + topView.views + ")" : "yo‘q"}

❤️ Eng ko‘p like:
${topLike ? topLike.title + " (" + topLike.likes.length + ")" : "yo‘q"}
`);
  }

  if (text === '👑 Admin qo‘shish') {
    if (!isAdmin(id)) return;
    state[id] = { step: 'add_admin' };
    return ctx.reply("Admin ID:");
  }

  if (text === '❌ Admin o‘chirish') {
    if (!isAdmin(id)) return;

    return ctx.reply("Adminlar:", Markup.inlineKeyboard(
      data.admins.map(a => [
        Markup.button.callback(`❌ ${a}`, `deladmin_${a}`)
      ])
    ));
  }

  if (text === '🛠 Support qo‘shish') {
    if (!isAdmin(id)) return;
    state[id] = { step: 'add_support' };
    return ctx.reply("Support ID:");
  }

  if (text === '🚫 Support o‘chirish') {
    if (!isAdmin(id)) return;

    return ctx.reply("Supportlar:", Markup.inlineKeyboard(
      data.supports.map(s => [
        Markup.button.callback(`❌ ${s}`, `delsup_${s}`)
      ])
    ));
  }

  // ===== STATE =====
  if (state[id]?.step === 'broadcast') {
    delete state[id];

    for (let user of data.users) {
      try {
        await ctx.telegram.sendMessage(user, text);
      } catch {}
    }

    return ctx.reply("✅ Yuborildi");
  }

  if (state[id]?.step === 'add_admin') {
    let uid = Number(text);

    if (!data.admins.includes(uid)) {
      data.admins.push(uid);
      saveData(data);
    }

    delete state[id];
    return ctx.reply("✅ Admin qo‘shildi");
  }

  if (state[id]?.step === 'add_support') {
    let uid = Number(text);

    if (!data.supports.includes(uid)) {
      data.supports.push(uid);
      saveData(data);
    }

    delete state[id];
    return ctx.reply("✅ Support qo‘shildi");
  }

  if (state[id]?.step === 'del_movie') {
    let code = text;

    let oldLen = data.movies.length;
    data.movies = data.movies.filter(m => m.code !== code);

    saveData(data);
    delete state[id];

    if (data.movies.length === oldLen) {
      return ctx.reply("❌ Bunday kino topilmadi");
    }

    return ctx.reply("✅ Kino o‘chirildi");
  }

  if (state[id]?.step === 'code') {
    state[id].code = text;
    state[id].step = 'title';
    return ctx.reply("🎬 Kino nomi:");
  }

  if (state[id]?.step === 'title') {
    state[id].title = text;
    state[id].step = 'video';
    return ctx.reply("📤 Video yubor:");
  }

  // ===== SEARCH =====
  if (state[id]) return;

  let movie = data.movies.find(m => m.code === text);
  if (!movie) return;

  movie.views++;
  saveData(data);

  return ctx.replyWithVideo(movie.file_id, {
    caption: `🎬 ${movie.title}\n👁 ${movie.views}\n👍 ${movie.likes.length}`,
    ...Markup.inlineKeyboard([
      [Markup.button.callback("👍 Like", `like_${movie.code}`)]
    ])
  });
});

// ===== VIDEO =====
bot.on('video', (ctx) => {
  let id = ctx.from.id;
  let data = loadData();

  if (state[id]?.step !== 'video') return;

  data.movies.push({
    code: state[id].code,
    title: state[id].title,
    file_id: ctx.message.video.file_id,
    views: 0,
    likes: []
  });

  saveData(data);
  delete state[id];

  ctx.reply("✅ Kino qo‘shildi");
});

// ===== ACTION =====
bot.action(/like_(.+)/, (ctx) => {
  let data = loadData();
  let code = ctx.match[1];
  let user = ctx.from.id;

  let movie = data.movies.find(m => m.code === code);
  if (!movie) return;

  if (movie.likes.includes(user)) {
    return ctx.answerCbQuery("❗ Oldin bosgansiz");
  }

  movie.likes.push(user);
  saveData(data);

  ctx.answerCbQuery("👍 Like bosildi");
});

bot.action(/deladmin_(.+)/, (ctx) => {
  let data = loadData();
  let id = Number(ctx.match[1]);

  data.admins = data.admins.filter(a => a !== id);
  saveData(data);

  ctx.editMessageText("❌ Admin o‘chirildi");
});

bot.action(/delsup_(.+)/, (ctx) => {
  let data = loadData();
  let id = Number(ctx.match[1]);

  data.supports = data.supports.filter(s => s !== id);
  saveData(data);

  ctx.editMessageText("🚫 Support o‘chirildi");
});

// ===== RUN =====
bot.launch();
console.log("🚀 FINAL PRO BOT ISHLAYAPTII");