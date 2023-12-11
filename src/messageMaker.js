const { MessageEmbed } = require('discord.js');

const rollParser = require('./parseRolls.js');
const emoteParser = require('./parseEmotes.js');

exports.makeRollMessage = (rollSnapshot, roomName) => {
  const parsedRoll = rollParser.parseRoll(rollSnapshot, roomName)
  const embed = new MessageEmbed()
    .setColor(parsedRoll.color)
    .setAuthor({ name: parsedRoll.author }) //, iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
    .setTitle(parsedRoll.result)
    .setDescription(parsedRoll.details)
    // .setFooter( getFooterObject(roomName, rollSnapshot) )

    // .setURL('https://discord.js.org/')
    // .setThumbnail('https://i.imgur.com/AfFp7pu.png')
    // .addFields(
    // 	{ name: 'Regular field title', value: 'Some value here' },
    // 	{ name: '\u200B', value: '\u200B' },
    // 	{ name: 'Inline field title', value: 'Some value here', inline: true },
    // 	{ name: 'Inline field title', value: 'Some value here', inline: true },
    // )
    // .addField('Inline field title', 'Some value here', true)
    // .setImage('https://i.imgur.com/AfFp7pu.png')
    // .setTimestamp()

  return embed
}

exports.makeEmoteMessage = (emoteKey, emoteSnapshot, roomName) => {
  const parsedEmote = emoteParser.parseEmote(emoteKey, emoteSnapshot, roomName)
  const embed = new MessageEmbed()
    .setColor(parsedEmote.color)
    // .setAuthor({ name: author_name }) //, iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
    .setTitle(parsedEmote.result)

  return embed
}
