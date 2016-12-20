const lastfm = require("lastfm-njs");
const fs = require('fs');
const ONE_HOUR = 60 * 60 * 1000;

module.exports = function (bot) {
  const lfm = new lastfm({
    apiKey: process.env.LASTFM_KEY,
    apiSecret: process.env.LASTFM_SECRET,
    username: process.env.LASTFM_USERNAME
  });

  var currentTrack = null;
  var lastAnnounce = null;
  var groups = JSON.parse(fs.readFileSync('groups.json')) || [];

  bot.on('message', function (msg) {
    if (!groups.includes(msg.chat.id)) groups.push(msg.chat.id);
    fs.writeFileSync('groups.json', JSON.stringify(groups))
  });

  function formatAnnounce() {
    let message = ''
    message += '🐻 ' + currentTrack.artist['#text'] + ' - ' + currentTrack.name + ' 🐻'
    return message
  }

  function announce() {
    console.log("lel");
    for (let group of groups) {
      bot.sendMessage(group, formatAnnounce())
    }
  }

  function printRes(res) {
    console.log(res);
    console.log(res.track[0]);
    console.log(new Date(parseInt(res.track[0].date.uts)*1000));

    let track = res.track[0]
    track.date = new Date(parseInt(track.date.uts)*1000);
    if (!currentTrack || track.date > currentTrack.date) {
      currentTrack = track;
      if (!lastAnnounce || ((new Date) - lastAnnounce) < ONE_HOUR) {
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
       limit: 5
    }).then(printRes, printError);
  }

  fetch()
  setInterval(fetch, 5 * 60 * 1000)

}
