const { MessageEmbed } = require('discord.js');

const parseEmote = (emoteKey, emoteSnapshot, roomName) => {
  console.log('emoteSnapshot',emoteSnapshot)
  console.log('emote key:', emoteKey);

  let embed;

  switch (emoteKey) {
  case 'xcard':
    embed = parseXCard(emoteSnapshot, roomName)
    break;
  }

  return embed
}



function parseXCard(emoteSnapshot, roomName) {
  let result_text = `❌     X-card raised by ${emoteSnapshot.name}.     ❌`

  // inside a command, event listener, etc.
  const embed = new MessageEmbed()
  	.setColor('#FF0000')
    // .setAuthor({ name: author_name }) //, iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
  	.setTitle(result_text)

  return embed
}



exports.parseEmote = parseEmote
