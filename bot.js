const fs = require("fs");
const path = require("path");
const { Telegraf, filter } = require('telegraf');
const Markup = require('telegraf/markup');

const dropUpdates = filter(({ message }) => {
    const now = new Date().getTime() / 1000;
    return !message || message.date > (now - 60 * 2);
});

require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(dropUpdates);

let voices;

async function loadVoices() {
    const jsonVoices = fs.readFileSync(path.join(__dirname, "timur.json"));
    voices = JSON.parse(jsonVoices);
}

bot.on("inline_query", async ({ inlineQuery, answerInlineQuery }) => {
    try {

        const programmer = Math.floor(Math.random() * 100) + 1;
        const query = inlineQuery.query.trim();
        let foundVoices;
        if (query) {
            foundVoices = voices.filter(v => v.tags.includes(query));
        } else {
            foundVoices = voices;
        }
        const repsonse = foundVoices.map((v, index) => {
            return {
                type: "voice",
                id: index + 2,
                title: v.title,
                voice_url: v.voice_url
            }
        });
        repsonse.unshift({
            type: "article",
            id: 1,
            title: `Какой уровень программирования у ${query || "у тебя"}?`,
            thumb_url: "https://i.ibb.co/3dkm2wk/tmr-pic.jpg",
            reply_markup: Markup.inlineKeyboard([
                Markup.switchToCurrentChatButton("Поделиться своим уровнем программирования", '')
            ]),
            input_message_content: {
                message_text: query ? `У ${query} есть ${programmer} паяльник(-ов)!` : `У меня ${programmer} паяльник(-ов)!`
            }
        })
        return answerInlineQuery(repsonse, { cache_time: 10 })
    } catch (e) {
        console.log(e);
    }
});


async function startBot() {
    await loadVoices();

    if (process.env.BOT_ENV == "prod") {
        const port = parseInt(process.env.PORT || "3000");

        await bot.launch({
            webhook: {
                domain: process.env.WH_DOMAIN,
                port
            }
        });

        console.log(`Bot started in production configuraion on port ${port}`);
    }
    else if (process.env.BOT_ENV == "dev") {
        await bot.launch();
        console.log("Bot stated in dev configuraion");
    }
    else console.log("Unknown BOT_ENV Value");
}

startBot();