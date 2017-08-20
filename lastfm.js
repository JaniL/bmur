const lastfm = require('lastfm-njs')
const fs = require('fs')
const moment = require('moment')
const ONE_HOUR = 60 * 60 * 1000
const FETCH_INTERVAL = 10 * 1000 // ms

module.exports = (bot) => {
  const lfm = new lastfm({
    apiKey: process.env.LASTFM_KEY,
    apiSecret: process.env.LASTFM_SECRET,
    username: process.env.LASTFM_USERNAME
  })

  var tracks = []
  var lastAnnounce = null
  var groups = JSON.parse(fs.readFileSync('groups.json')) || []

  bot.on('message', (msg) => {
    if (msg.chat.type !== 'private' && !groups.includes(msg.chat.id)) groups.push(msg.chat.id)
    fs.writeFileSync('groups.json', JSON.stringify(groups))
  })

  function formatAnnounce () {
    let message = ''
    message += '🐻 ' + tracks[0].artist['#text'] + ' - ' + tracks[0].name + ' 🐻'
    return message
  }

  function formatCommand () {
    let message = ''
    message += '🐻 ' + tracks[0].artist['#text'] + ' - ' + tracks[0].name + ' 🐻'
    message += '\n' + moment(tracks[0].date).fromNow()
    return message
  }

  function formatRecent (t) {
    return '- [' + t.artist['#text'] + ' - ' + t.name + '](' + t.url + ') (' + moment(t.date).fromNow() + ')'
  }

  bot.onText(/\/np/, (msg) => {
    bot.sendMessage(msg.chat.id, formatCommand())
  })

  bot.onText(/\/recent/, (msg) => {
    var tClone = tracks.slice(0).reverse()
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

  function trackHasBeenPlayedDuringTheLastHour (track) {
    return ((new Date()) - track.date) <= ONE_HOUR
  }

  function convertDate (track) {
    if (track['@attr'] && track['@attr'].nowplaying === 'true') {
      track.date = new Date()
    } else {
      track.date = new Date(parseInt(track.date.uts) * 1000)
    }
    return track
  }

  function printRes (res) {
    if (!res || !('track' in res) || res.track.length === 0) {
      return
    }
    tracks = res.track.map(convertDate)
    if (trackHasBeenPlayedDuringTheLastHour(tracks[0]) && (!lastAnnounce || ((new Date()) - lastAnnounce) >= ONE_HOUR)) {
      lastAnnounce = new Date()
      announce()
    }
  }

  function printError (err) {
    console.error(err)
  }

  function fetch () {
    lfm.user_getRecentTracks({
      user: 'matlu_klusteri',
      limit: 10
    }).then(printRes, printError).then(() => setTimeout(fetch, FETCH_INTERVAL))
  }

  fetch()
}
