const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const path = require('path');

const TOKEN = '8836288629:AAHax7Aadt8ouksQKqxhLx4qAIuMgWcSbCM';
const bot = new Telegraf(TOKEN);
const app = express();

const ADMIN_ID = 6741153061;
const PORT = process.env.PORT || 3000;

let db = {
    users: {},
    promoCodes: { "GIFT2026": 1.0, "SUPERADMIN": 5.0 }
};

// HTML faylni ochish uchun Express sozlamasi
app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serverni ishga tushirish
app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishga tushdi.`);
});

// Telegram Bot logikasi
bot.start((ctx) => {
    const userId = ctx.from.id;
    if (!db.users[userId]) {
        db.users[userId] = { balance: 0 };
    }

    const isAdmin = userId === ADMIN_ID;
    
    // Fly.io bergan domen (masalan: https://giftnice-bot.fly.dev)
    const webAppUrl = process.env.WEBAPP_URL || `https://giftnice-bot.fly.dev`;

    let keyboard = [
        [Markup.button.webApp("🎮 Case Ochish", webAppUrl)],
        [Markup.button.callback("💰 Balansim", "check_balance")]
    ];

    if (isAdmin) {
        keyboard.push([Markup.button.callback("⚙️ Admin Panel", "admin_panel")]);
    }

    ctx.reply(
        `Xush kelibsiz, ${ctx.from.first_name}!\nGiftNice sovg'alar botiga marhamat. Quyidagi tugma orqali o'yinga kiring:`,
        Markup.inlineKeyboard(keyboard)
    );
});

bot.action('check_balance', (ctx) => {
    const userId = ctx.from.id;
    const balance = db.users[userId] ? db.users[userId].balance : 0;
    ctx.answerCbQuery();
    ctx.reply(`Sizning joriy balansingiz: <b>${balance} USDT</b>`, { parse_mode: 'HTML' });
});

bot.action('admin_panel', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery("Siz admin emassiz!");

    ctx.answerCbQuery();
    ctx.editMessageText(
        "⚙️ **Admin Boshqaruv Paneli:**\n\nTanlang:",
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback("➕ Promokod yaratish", "create_promo")],
                [Markup.button.callback("📊 Statistika", "stats")],
                [Markup.button.callback("🔙 Orqaga", "back_start")]
            ])
        }
    );
});

bot.action('create_promo', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    ctx.answerCbQuery();
    ctx.reply("Promokod yaratish uchun quyidagi formatda yuboring:\n`/addpromo KOD MIQDOR`\n\nMisol: `/addpromo BONUS5 1.5`", { parse_mode: 'Markdown' });
});

bot.command('addpromo', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        return ctx.reply("Xato format! Ishlatilishi: /addpromo KOD MIQDOR");
    }

    const code = args[1].toUpperCase();
    const amount = parseFloat(args[2]);

    if (isNaN(amount)) {
        return ctx.reply("Miqdor raqam bo'lishi kerak!");
    }

    db.promoCodes[code] = amount;
    ctx.reply(`✅ Muvaffaqiyatli yaratildi!\nPromokod: <b>${code}</b>\nQiymati: <b>+${amount} USDT</b>`, { parse_mode: 'HTML' });
});

bot.action('stats', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    const totalUsers = Object.keys(db.users).length;
    const totalPromos = Object.keys(db.promoCodes).length;

    ctx.answerCbQuery();
    ctx.editMessageText(
        `📊 **Bot Statistikasi:**\n\n👥 Foydalanuvchilar soni: ${totalUsers}\n🎁 Faol promokodlar: ${totalPromos}`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Orqaga", "admin_panel")]])
        }
    );
});

bot.action('back_start', (ctx) => {
    ctx.answerCbQuery();
    const webAppUrl = process.env.WEBAPP_URL || `https://giftnice-bot.fly.dev`;
    ctx.editMessageText("Bosh menyu:", Markup.inlineKeyboard([
        [Markup.button.webApp("🎮 Case Ochish", webAppUrl)],
        [Markup.button.callback("⚙️ Admin Panel", "admin_panel")]
    ]));
});

bot.launch();
console.log("Telegram bot ishga tushdi!");
