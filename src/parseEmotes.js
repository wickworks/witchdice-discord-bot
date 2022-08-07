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

  return {
    color: '#FF0000',
    // author: author_name,
    result: title_text,
    // details: message_text
  }
}



exports.parseEmote = parseEmote
