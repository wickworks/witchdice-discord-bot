const { Client, Intents } = require('discord.js');
const fs = require('fs');
const util = require('util');
require('dotenv').config();

// const { initializeApp } = require("firebase/app");
// const { getDatabase } = require("firebase/database");

// const { initializeApp } = require('firebase-admin/app');
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://roll-to-hit.firebaseio.com'
});

let database = admin.database();

// const firebaseApp = initializeApp(firebaseConfig);
// const firebaseDB = getDatabase(firebaseApp)

// Development: point to the local firebase emulator instead of production
// if (process.env.WITCHBOT_TOKEN === "development") {
//   firebase.database().useEmulator("localhost", 9000);
// }

// Convert fs.readFile into Promise version of same
const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf8');



// ------------------------------------
// ------------ GLOBAL VARS ------------
// ------------------------------------
const CONNECTED_CHANNEL_FILE = 'rooms.json'
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
let allConnectedChannels = {}

// ------------------------------------
// ------------ EVENTS ------------
// ------------------------------------

// When the client is ready, run this code (only once)
client.once('ready', () => {
  console.info(`Logged in as ${client.user}!`);
  // initializeBot()

  loadAllConnectedChannels()
});

// populate connected rooms from the local json file
async function loadAllConnectedChannels() {
  console.log('Loading connected channels....');

  const channelData = await readFile(CONNECTED_CHANNEL_FILE)
  allConnectedChannels = JSON.parse(channelData);

  console.log('Initialized room connections');
  console.log(allConnectedChannels);

  console.log('Listening for rolls....');
  Object.keys(allConnectedChannels).forEach(channelID => {
    listenForRolls(channelID, allConnectedChannels[channelID])
  });
}




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
client.login(process.env.WITCHBOT_TOKEN);


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
      listenForRolls(channelID, roomName)

    // It switched from another room to this one
    } else if (allConnectedChannels[channelID] !== roomName) {
      replyString = `This channel has switched from the room '${allConnectedChannels[channelID]}' to '${roomName}'.`
      allConnectedChannels[channelID] = roomName
      saveConnectedChannels()
      listenForRolls(channelID, roomName)

      // TODO: leave the previous channel

    } else {
      replyString = `This channel was already in the room '${allConnectedChannels[channelID]}'!`
    }
  }

  return replyString
}

// set up the listeners for a room
function listenForRolls(channelID, roomName) {
  console.log('    Creating listeners for room', roomName,' to channel ', channelID);
  // const channel = client.channels.cache.get(channelID);

  const dbRollsRef = database.ref().child('rolls').child(roomName)
  dbRollsRef.on('child_changed', (snapshot) => {
    if (snapshot) { console.log('roll changed!', snapshot.val()) }
  });
  dbRollsRef.on('child_added', (snapshot) => {
    if (snapshot) { console.log('roll added!', snapshot.val()) }
  });
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
