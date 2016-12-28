const lastfm = require("lastfm-njs");
const fs = require('fs');
const moment = require('moment');
const ONE_HOUR = 60 * 60 * 1000;

module.exports = (bot) => {
  const lfm = new lastfm({
    apiKey: process.env.LASTFM_KEY,
    apiSecret: process.env.LASTFM_SECRET,
    username: process.env.LASTFM_USERNAME
  });

  var tracks = [];
  var lastAnnounce = null;
  var groups = JSON.parse(fs.readFileSync('groups.json')) || [];

  bot.on('message', (msg) => {
    if (msg.chat.type !== 'private' && !groups.includes(msg.chat.id)) groups.push(msg.chat.id);
    fs.writeFileSync('groups.json', JSON.stringify(groups))
  });

  function formatAnnounce() {
    let message = ''
    message += '🐻 ' + tracks[0].artist['#text'] + ' - ' + tracks[0].name + ' 🐻'
    return message
  }

  function formatCommand() {
    let message = ''
    message += '🐻 ' + tracks[0].artist['#text'] + ' - ' + tracks[0].name + ' 🐻'
    message += '\n' + moment(tracks[0].date).fromNow()
    return message
  }

  bot.onText(/\/np/, (msg) => {
    bot.sendMessage(msg.chat.id, formatCommand())
  })

  function announce() {
    for (let group of groups) {
      bot.sendMessage(group, formatAnnounce())
    }
  }

  function trackHasBeenPlayedDuringTheLastHour(track) {
    return ((new Date) - track.date) <= ONE_HOUR
  }

  function convertDate(track) {
    if (track['@attr'] && track['@attr'].nowplaying === 'true') {
      track.date = new Date()
    } else {
      track.date = new Date(parseInt(track.date.uts)*1000);
    }
    return track;
  }

  function printRes(res) {
    res = res.track.map(convertDate)
    if (!tracks || tracks.length === 0 || res[0].date > tracks[0].date) {
      tracks = res;
      if (trackHasBeenPlayedDuringTheLastHour(res[0]) && (!lastAnnounce || ((new Date) - lastAnnounce) >= ONE_HOUR)) {
        lastAnnounce = new Date()
        announce()
      }
    }
  }

  function printError(err) {
    console.error(err);
  }

  function fetch() {
    lfm.user_getRecentTracks({
       user: 'matlu_klusteri',
       limit: 10
    }).then(printRes, printError);
  }

  fetch()
  setInterval(fetch, 5 * 60 * 1000)

}
