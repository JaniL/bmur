require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_TOKEN
const lastfm = require('./lastfm.js')

if (!token) {
  console.error("No token set")
  process.exit(1)
}

var bot = new TelegramBot(token, { polling: true });

lastfm(bot);
