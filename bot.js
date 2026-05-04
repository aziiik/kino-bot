// require("dotenv").config();
// const TelegramBot = require("node-telegram-bot-api");
// const fs = require("fs");

// const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// const OWNER_ID = Number(process.env.ADMIN_ID);

// // DATABASE
// let db = {
//   admins: [],
//   supports: [],
//   users: [],
//   movies: {},
//   channels: []
// };

// if (fs.existsSync("db.json")) {
//   db = JSON.parse(fs.readFileSync("db.json"));
// }

// function save() {
//   fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
// }

// function isAdmin(id) {
//   return id === OWNER_ID || db.admins.includes(id);
// }

// // STEP SYSTEM
// let step = {};

// // 🔒 CHECK SUB
// async function checkSub(userId) {
//   let notJoined = [];

//   for (let ch of db.channels) {
//     try {
//       const res = await bot.getChatMember(ch, userId);
//       if (!["member", "administrator", "creator"].includes(res.status)) {
//         notJoined.push(ch);
//       }
//     } catch {
//       notJoined.push(ch);
//     }
//   }

//   return notJoined;
// }

// // START
// bot.onText(/\/start/, async (msg) => {
//   const id = msg.from.id;

//   delete step[id]; // 🔥 STEP RESET

//   if (!db.users.includes(id)) {
//     db.users.push(id);
//     save();
//   }

//   const notJoined = await checkSub(id);

//   if (notJoined.length > 0) {
//     return bot.sendMessage(id, "❗ Avval obuna bo‘ling:", {
//       reply_markup: {
//         inline_keyboard: [
//           ...notJoined.map(ch => [
//             { text: `📢 ${ch}`, url: `https://t.me/${ch.replace("@", "")}` }
//           ]),
//           [{ text: "✅ Tekshirish", callback_data: "check_sub" }]
//         ]
//       }
//     });
//   }

//   bot.sendMessage(id, "🎬 Kod yuboring:");
// });

// // CALLBACK
// bot.on("callback_query", async (q) => {
//   const id = q.from.id;

//   if (q.data === "check_sub") {
//     const notJoined = await checkSub(id);

//     if (notJoined.length === 0) {
//       bot.answerCallbackQuery(q.id, { text: "✅ OK" });
//       bot.sendMessage(id, "🎉 Ruxsat berildi!");
//     } else {
//       bot.answerCallbackQuery(q.id, {
//         text: "❗ Obuna bo‘ling",
//         show_alert: true
//       });
//     }
//   }

//   if (q.data.startsWith("del_channel_")) {
//     const ch = q.data.replace("del_channel_", "");
//     db.channels = db.channels.filter(c => c !== ch);
//     save();

//     bot.answerCallbackQuery(q.id, { text: "🗑 O‘chirildi" });
//     bot.editMessageText("✅ Kanal o‘chirildi", {
//       chat_id: q.message.chat.id,
//       message_id: q.message.message_id
//     });
//   }
// });

// // ADMIN PANEL
// bot.onText(/\/admin/, (msg) => {
//   if (!isAdmin(msg.from.id)) return;

//   delete step[msg.from.id];

//   bot.sendMessage(msg.chat.id, "⚙️ Admin panel", {
//     reply_markup: {
//       keyboard: [
//         ["🎬 Kino qo‘shish", "❌ Kino o‘chirish"],
//         ["📢 Kanal qo‘shish", "❌ Kanal o‘chirish"],
//         ["👤 Admin qo‘shish", "❌ Admin o‘chirish"],
//         ["🛠 Support qo‘shish", "❌ Support o‘chirish"],
//         ["📊 Statistika"]
//       ],
//       resize_keyboard: true
//     }
//   });
// });

// // MESSAGE HANDLER
// bot.on("message", async (msg) => {
//   const id = msg.from.id;
//   const text = msg.text;

//   if (!text) return;

//   // 🔥 STEP RESET universal
//   if (text.startsWith("/")) {
//     delete step[id];
//   }

//   // 🎬 ADD MOVIE
//   if (text === "🎬 Kino qo‘shish") {
//     delete step[id];
//     step[id] = "movie_code";
//     return bot.sendMessage(id, "Kod yubor:");
//   }

//   if (step[id] === "movie_code") {
//     step[id] = { code: text };
//     return bot.sendMessage(id, "Video yubor:");
//   }

//   if (msg.video && step[id]?.code) {
//     db.movies[step[id].code] = msg.video.file_id;
//     save();
//     step[id] = null;
//     return bot.sendMessage(id, "✅ Kino qo‘shildi");
//   }

//   // ❌ DELETE MOVIE
//   if (text === "❌ Kino o‘chirish") {
//     delete step[id];
//     step[id] = "del_movie";
//     return bot.sendMessage(id, "Kod yubor:");
//   }

//   if (step[id] === "del_movie") {
//     delete db.movies[text];
//     save();
//     step[id] = null;
//     return bot.sendMessage(id, "🗑 O‘chirildi");
//   }

//   // 📢 ADD CHANNEL
//   if (text === "📢 Kanal qo‘shish") {
//     delete step[id];
//     step[id] = "add_channel";
//     return bot.sendMessage(id, "@kanal yubor:");
//   }

//   if (step[id] === "add_channel") {
//     db.channels.push(text);
//     save();
//     step[id] = null;
//     return bot.sendMessage(id, "✅ Qo‘shildi");
//   }

//   // ❌ CHANNEL DELETE
//   if (text === "❌ Kanal o‘chirish") {
//     delete step[id];

//     if (db.channels.length === 0) {
//       return bot.sendMessage(id, "❗ Kanal yo‘q");
//     }

//     const buttons = db.channels.map(ch => [
//       { text: ch, callback_data: "del_channel_" + ch }
//     ]);

//     return bot.sendMessage(id, "Tanlang:", {
//       reply_markup: { inline_keyboard: buttons }
//     });
//   }

//   // 👤 ADMIN ADD
//   if (text === "👤 Admin qo‘shish") {
//     delete step[id];
//     step[id] = "add_admin";
//     return bot.sendMessage(id, "ID yubor:");
//   }

//   if (step[id] === "add_admin") {
//     db.admins.push(Number(text));
//     save();
//     step[id] = null;
//     return bot.sendMessage(id, "✅ Qo‘shildi");
//   }

//   // ❌ ADMIN DELETE
//   if (text === "❌ Admin o‘chirish") {
//     delete step[id];
//     step[id] = "del_admin";
//     return bot.sendMessage(id, "ID yubor:");
//   }

//   if (step[id] === "del_admin") {
//     db.admins = db.admins.filter(a => a != text);
//     save();
//     step[id] = null;
//     return bot.sendMessage(id, "🗑 O‘chirildi");
//   }

//   // 🛠 SUPPORT ADD
//   if (text === "🛠 Support qo‘shish") {
//     delete step[id];
//     step[id] = "add_support";
//     return bot.sendMessage(id, "ID yubor:");
//   }

//   if (step[id] === "add_support") {
//     db.supports.push(Number(text));
//     save();
//     step[id] = null;
//     return bot.sendMessage(id, "✅ Qo‘shildi");
//   }

//   // ❌ SUPPORT DELETE
//   if (text === "❌ Support o‘chirish") {
//     delete step[id];
//     step[id] = "del_support";
//     return bot.sendMessage(id, "ID yubor:");
//   }

//   if (step[id] === "del_support") {
//     db.supports = db.supports.filter(s => s != text);
//     save();
//     step[id] = null;
//     return bot.sendMessage(id, "🗑 O‘chirildi");
//   }

//   // 📊 STAT
//   if (text === "📊 Statistika") {
//     delete step[id];
//     return bot.sendMessage(id, `👥 Users: ${db.users.length}`);
//   }

//   // 🎬 GET MOVIE
//   if (db.movies[text]) {
//     const notJoined = await checkSub(id);

//     if (notJoined.length > 0) {
//       return bot.sendMessage(id, "❗ Avval obuna bo‘ling");
//     }

//     return bot.sendVideo(id, db.movies[text]);
//   }
// });

















require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const OWNER_ID = Number(process.env.ADMIN_ID);

// DATABASE
let db = {
  admins: [],
  supports: [],
  users: [],
  movies: {},
  channels: []
};

if (fs.existsSync("db.json")) {
  db = JSON.parse(fs.readFileSync("db.json"));
}

function save() {
  fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
}

function isAdmin(id) {
  return id === OWNER_ID || db.admins.includes(id);
}

// STEP SYSTEM
let step = {};

// 🔒 CHECK SUB
async function checkSub(userId) {
  let notJoined = [];

  for (let ch of db.channels) {
    try {
      const res = await bot.getChatMember(ch, userId);
      if (!["member", "administrator", "creator"].includes(res.status)) {
        notJoined.push(ch);
      }
    } catch {
      notJoined.push(ch);
    }
  }

  return notJoined;
}

// START
bot.onText(/\/start/, async (msg) => {
  const id = msg.from.id;

  delete step[id];

  if (!db.users.includes(id)) {
    db.users.push(id);
    save();
  }

  const notJoined = await checkSub(id);

  if (notJoined.length > 0) {
    return bot.sendMessage(id, "❗ Avval obuna bo‘ling:", {
      reply_markup: {
        inline_keyboard: [
          ...notJoined.map(ch => [
            { text: `📢 ${ch}`, url: `https://t.me/${ch.replace("@", "")}` }
          ]),
          [{ text: "✅ Tekshirish", callback_data: "check_sub" }]
        ]
      }
    });
  }

  bot.sendMessage(id, "🎬 Kod yuboring:");
});

// CALLBACK
bot.on("callback_query", async (q) => {
  const id = q.from.id;

  if (q.data === "check_sub") {
    const notJoined = await checkSub(id);

    if (notJoined.length === 0) {
      bot.answerCallbackQuery(q.id, { text: "✅ OK" });
      bot.sendMessage(id, "🎉 Ruxsat berildi!");
    } else {
      bot.answerCallbackQuery(q.id, {
        text: "❗ Obuna bo‘ling",
        show_alert: true
      });
    }
  }

  if (q.data.startsWith("del_channel_")) {
    const ch = q.data.replace("del_channel_", "");
    db.channels = db.channels.filter(c => c !== ch);
    save();

    bot.answerCallbackQuery(q.id, { text: "🗑 O‘chirildi" });
    bot.editMessageText("✅ Kanal o‘chirildi", {
      chat_id: q.message.chat.id,
      message_id: q.message.message_id
    });
  }
});

// ADMIN PANEL
bot.onText(/\/admin/, (msg) => {
  if (!isAdmin(msg.from.id)) return;

  delete step[msg.from.id];

  bot.sendMessage(msg.chat.id, "⚙️ Admin panel", {
    reply_markup: {
      keyboard: [
        ["🎬 Kino qo‘shish", "❌ Kino o‘chirish"],
        ["📢 Kanal qo‘shish", "❌ Kanal o‘chirish"],
        ["📨 Xabar yuborish", "📊 Statistika"],
        ["👤 Admin qo‘shish", "❌ Admin o‘chirish"],
        ["🛠 Support qo‘shish", "❌ Support o‘chirish"]
      ],
      resize_keyboard: true
    }
  });
});

// MESSAGE HANDLER
bot.on("message", async (msg) => {
  const id = msg.from.id;
  const text = msg.text;

  if (!text) return;

  if (text.startsWith("/")) {
    delete step[id];
  }

  // 🎬 ADD MOVIE
  if (text === "🎬 Kino qo‘shish") {
    delete step[id];
    step[id] = "movie_code";
    return bot.sendMessage(id, "Kod yubor:");
  }

  if (step[id] === "movie_code") {
    step[id] = { code: text };
    return bot.sendMessage(id, "Video yubor:");
  }

  if (msg.video && step[id]?.code) {
    db.movies[step[id].code] = msg.video.file_id;
    save();
    step[id] = null;
    return bot.sendMessage(id, "✅ Kino qo‘shildi");
  }

  // ❌ DELETE MOVIE
  if (text === "❌ Kino o‘chirish") {
    delete step[id];
    step[id] = "del_movie";
    return bot.sendMessage(id, "Kod yubor:");
  }

  if (step[id] === "del_movie") {
    delete db.movies[text];
    save();
    step[id] = null;
    return bot.sendMessage(id, "🗑 O‘chirildi");
  }

  // 📢 ADD CHANNEL
  if (text === "📢 Kanal qo‘shish") {
    delete step[id];
    step[id] = "add_channel";
    return bot.sendMessage(id, "@kanal yubor:");
  }

  if (step[id] === "add_channel") {
    db.channels.push(text);
    save();
    step[id] = null;
    return bot.sendMessage(id, "✅ Qo‘shildi");
  }

  // ❌ CHANNEL DELETE
  if (text === "❌ Kanal o‘chirish") {
    delete step[id];

    if (db.channels.length === 0) {
      return bot.sendMessage(id, "❗ Kanal yo‘q");
    }

    const buttons = db.channels.map(ch => [
      { text: ch, callback_data: "del_channel_" + ch }
    ]);

    return bot.sendMessage(id, "Tanlang:", {
      reply_markup: { inline_keyboard: buttons }
    });
  }

  // 📢 BROADCAST
  if (text === "📨 Xabar yuborish") {
    delete step[id];
    step[id] = "broadcast";
    return bot.sendMessage(id, "Xabar yozing:");
  }

  if (step[id] === "broadcast") {
    let ok = 0;
    let no = 0;

    for (let user of db.users) {
      try {
        await bot.sendMessage(user, text);
        ok++;
      } catch {
        no++;
      }
    }

    step[id] = null;

    return bot.sendMessage(id,
      `✅ Tugadi\n\n📤 Yuborildi: ${ok}\n❌ Xato: ${no}`
    );
  }

  // 📊 STAT
  if (text === "📊 Statistika") {
    delete step[id];

    return bot.sendMessage(id,
`📊 STATISTIKA

👥 Users: ${db.users.length}
🎬 Kino: ${Object.keys(db.movies).length}
📢 Kanal: ${db.channels.length}
👤 Admin: ${db.admins.length + 1}
🛠 Support: ${db.supports.length}`
    );
  }

  // 🎬 GET MOVIE
  if (db.movies[text]) {
    const notJoined = await checkSub(id);

    if (notJoined.length > 0) {
      return bot.sendMessage(id, "❗ Avval obuna bo‘ling");
    }

    return bot.sendVideo(id, db.movies[text]);
  }
});