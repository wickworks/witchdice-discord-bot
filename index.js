
// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');

const fs = require('fs');

require('dotenv').config();


// GLOBAL VARS
const CONNECTED_CHANNEL_FILE = 'rooms.json'
let allConnectedChannels = {}

const commands = [{
  name: '~join',
  description: 'The current channel joins a witchdice room.'
}];

// ------------------------------------
// ------------ CREATE THE BOT ------------
// ------------------------------------

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// log in with the bot

// ------------------------------------
// ------------ EVENTS ------------
// ------------------------------------

// When the client is ready, run this code (only once)
client.once('ready', () => {
  console.info(`Logged in as ${client.user}!`);

  // populate connected rooms from the local json file
  fs.readFile(CONNECTED_CHANNEL_FILE, (err, data) => {
      if (err) throw err;
      allConnectedChannels = JSON.parse(data);
      console.log('Initialized room connections');
      console.log(allConnectedChannels);
  });
});

// Login to Discord with your client's token
client.login(process.env.WITCHBOT_TOKEN);

//
// bot.on('message', msg => {
//   const args = msg.content.split(/ +/);
//   const command = args.shift().toLowerCase();
//   if (!bot.commands.has(command)) return;
//
//   console.info(`Called command: ${command}`);
//
//   try {
//     switch(command) {
//       case '~join': joinRoom(msg.channel.id, args[0]); break;
//       default: break;
//     }
//   } catch (error) {
//     console.error(error);
//     msg.reply('there was an error trying to execute that command!');
//   }
// });


// ------------------------------------
// ------------ COMMANDS ------------
// ------------------------------------

function joinRoom(channelID, roomName){
  console.log(`Joining room : ${roomName}`);

  if (room_name) {
    // This channel wasn't connected to anything yet
    if (!(channelID in allConnectedChannels)) {
      msg.channel.send(`This channel is now in the room '${room_name}'.`);
      allConnectedChannels[channelID] = roomName
      saveConnectedChannels()

    // It switched from another room to this one
    } else if (allConnectedChannels[channelID] !== roomName) {
      msg.channel.send(`This channel has switched from the room '${allConnectedChannels[channelID]}' to '${room_name}'.`);
      allConnectedChannels[channelID] = roomName
      saveConnectedChannels()

    } else {
      msg.channel.send(`This channel was already in the room '${allConnectedChannels[channelID]}'!`);
    }
  }
}


// ------------------------------------
// ------------ UTILS ------------
// ------------------------------------


function saveConnectedChannels() {
  console.log('Saving connected channels:');
  console.log(allConnectedChannels);
  let data = JSON.stringify(allConnectedChannels);

  fs.writeFile(CONNECTED_CHANNEL_FILE, data, (err) => {
    if (err) throw err;
    console.log('Data written to file!');
  });
}
