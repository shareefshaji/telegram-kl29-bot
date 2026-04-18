const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const bot = new TelegramBot(process.env.BOT_TOKEN);

const replies = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'replies.json'))
);

const dataPath = path.join(__dirname, 'data.json');

function loadData() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ users: {} }));
  }
  return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function getReply(text) {
  text = text.toLowerCase();

  for (let r of replies.replies) {
    for (let k of r.keywords) {
      if (text.includes(k)) return r.reply;
    }
  }
  return null;
}

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  if (!body.message) return { statusCode: 200 };

  const msg = body.message;
  const chatId = msg.chat.id;
  const text = msg.text || "";

  const ADMIN_ID = 123456789;

  let data = loadData();

  if (!data.users[chatId]) {
    data.users[chatId] = { messages: 0, lastSeen: Date.now() };
  }

  data.users[chatId].messages++;
  data.users[chatId].lastSeen = Date.now();

  saveData(data);

  const reply = getReply(text);

  if (reply) {
    await bot.sendMessage(chatId, reply);
  }

  if (chatId !== ADMIN_ID) {
    await bot.sendMessage(ADMIN_ID, `📩 ${chatId}\n\n${text}`);
    await bot.sendMessage(chatId, "✅ Sent to admin");
  }

  return { statusCode: 200 };
};
