const { Client, Intents } = require('discord.js');
const fs = require('fs');
require('dotenv').config();


// GLOBAL VARS
const WITCHBOT_TOKEN = process.env.WITCHBOT_TOKEN

const CONNECTED_CHANNEL_FILE = 'rooms.json'
let allConnectedChannels = {}

// ------------------------------------
// ------------ CREATE THE BOT ------------
// ------------------------------------

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

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

client.on('interactionCreate', async interaction => {
  // console.log('triggered interaction!', interaction);
	if (!interaction.isCommand()) return;

	const { commandName, options, channelId } = interaction;

  console.log('   commandName', commandName);

	if (commandName === 'join-room') {
    const roomName = options.getString('room')
    const replyString = joinRoom(channelId, roomName)
		await interaction.reply(replyString)
	}
});


// Login to Discord with your client's token
client.login(WITCHBOT_TOKEN);


// ------------------------------------
// ------------ COMMANDS ------------
// ------------------------------------

function joinRoom(channelID, roomName){
  console.log(`Joining room : ${roomName}`);
  let replyString = ''

  if (roomName) {
    // This channel wasn't connected to anything yet
    if (!(channelID in allConnectedChannels)) {
      replyString = `This channel is now in the room '${roomName}'.`
      allConnectedChannels[channelID] = roomName
      saveConnectedChannels()

    // It switched from another room to this one
    } else if (allConnectedChannels[channelID] !== roomName) {
      replyString = `This channel has switched from the room '${allConnectedChannels[channelID]}' to '${roomName}'.`
      allConnectedChannels[channelID] = roomName
      saveConnectedChannels()

    } else {
      replyString = `This channel was already in the room '${allConnectedChannels[channelID]}'!`
    }
  }

  return replyString
}


// ------------------------------------
// ------------ UTILS ------------
// ------------------------------------


// POTENTIAL RACE CONDITION HERE!!!!
// If multiple people join rooms at once, one of them could get lost.
function saveConnectedChannels() {
  console.log('Saving connected channels:');
  console.log(allConnectedChannels);
  let data = JSON.stringify(allConnectedChannels);

  fs.writeFile(CONNECTED_CHANNEL_FILE, data, (err) => {
    if (err) throw err;
    console.log('Data written to file!');
  });
}
