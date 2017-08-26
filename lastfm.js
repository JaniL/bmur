const LastFm = require('lastfm-njs')
const fs = require('fs')
const moment = require('moment')
const ONE_HOUR = 60 * 60 * 1000
const FETCH_INTERVAL = 10 * 1000 // ms

module.exports = (bot) => {
  const lfm = new LastFm({
    apiKey: process.env.LASTFM_KEY,
    apiSecret: process.env.LASTFM_SECRET,
    username: process.env.LASTFM_USERNAME
  })

  var tracks = []
  var groups = JSON.parse(fs.readFileSync('groups.json')) || []

  bot.on('message', (msg) => {
    if (msg.chat.type !== 'private' && !groups.includes(msg.chat.id)) groups.push(msg.chat.id)
    fs.writeFileSync('groups.json', JSON.stringify(groups))
  })

  const formatTrack = t => `${t.artist['#text']} - ${t.name}`
  const formatAnnounce = () => `🐻 ${formatTrack(tracks[0])} 🐻`
  const formatCommand = () => `${formatAnnounce(tracks[0])}\n${moment(tracks[0].date).fromNow()}`
  const formatRecent = t => `- [${t.artist['#text']} - ${t.name}](${t.url}) (${moment(t.date).fromNow()})`

  bot.onText(/\/np/, (msg) => {
    bot.sendMessage(msg.chat.id, formatCommand())
  })

  bot.onText(/\/recent/, (msg) => {
    const tClone = tracks.slice(0).reverse()
    bot.sendMessage(msg.chat.id, tClone.map(formatRecent).join('\n'), {
      'disable_web_page_preview': true,
      'parse_mode': 'markdown'
    })
  })

  function announce () {
    for (let group of groups) {
      bot.sendMessage(group, formatAnnounce())
    }
  }

  function convertDate (track) {
    track.date = new Date(parseInt(track.date.uts) * 1000)
    return track
  }

  function printRes (res) {
    if (!res || !('track' in res) || res.track.length === 0) {
      return
    }
    tracks = res.track.map(convertDate)
    if ((new Date() - tracks[0].date <= FETCH_INTERVAL) && (tracks[0].date - tracks[1].date > ONE_HOUR)) {
      announce()
    }
  }

  function printError (err) {
    console.error(err)
  }

  const startTimeout = () => setTimeout(fetch, FETCH_INTERVAL)

  function fetch () {
    lfm.user_getRecentTracks({
      user: 'matlu_klusteri',
      limit: 10
    }).then(printRes, printError).then(startTimeout).catch(startTimeout)
  }

  fetch()
}
