const { Client, Intents } = require('discord.js');
const { clientId } = require('./config.json');
const fs = require('fs');
const util = require('util');
const rollParser = require('./src/parseRolls.js');
require('dotenv').config();

const { parseRoll, getColorFromTime } = require('./src/parseRolls.js');
const messageMaker = require('./src/messageMaker.js');

const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://roll-to-hit.firebaseio.com'
});

const database = admin.database();

// Convert fs.readFile into Promise version of same
const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf8');



// ------------------------------------
// ------------ GLOBAL VARS ------------
// ------------------------------------
const CONNECTED_CHANNEL_FILE = 'rooms.json'
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

let allConnectedChannels = {}
let allConnectedChannelListeners = {} // a mirror of the former, but points to the listener objects

// ------------------------------------
// ------------ EVENTS ------------
// ------------------------------------

// When the client is ready, run this code (only once)
client.once('ready', () => {
  console.info(`Logged in as ${client.user}!`);

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


  let replyString = '';
	switch (commandName) {
  case 'join-room':
    const roomName = options.getString('room')
    replyString = joinRoom(channelId, roomName)
		await interaction.reply(replyString)
    break;
  case 'current-room':
    replyString = sayCurrentRoom(channelId)
    await interaction.reply(replyString)
    break;
  case 'leave-room':
    replyString = leaveCurrentRoom(channelId)
    await interaction.reply(replyString)
    break;
  default: break;
	}
});


// Login to Discord with your client's token
client.login(process.env.WITCHBOT_TOKEN);


// ------------------------------------
// ------------ COMMANDS ------------
// ------------------------------------

function joinRoom(channelID, roomName){
  let replyString = ''
  if (roomName) {
    var filteredRoomName = roomName.replace(/[^A-Za-z0-9-]/ig, '')
    var nameIsValid = (roomName.indexOf('/') == -1 && filteredRoomName.length > 6)

    console.log(`Joining room : ${filteredRoomName}`);
    if (!nameIsValid || !filteredRoomName) {
      replyString = `\`${roomName}\` is not a valid room name. It must have at least 7 characters and only consist of letters, numbers, and dashes.`

    // This channel wasn't connected to anything yet
    } else if (!(channelID in allConnectedChannels)) {
      allConnectedChannels[channelID] = filteredRoomName
      saveConnectedChannels()
      listenForRolls(channelID, filteredRoomName)
      replyString = `This channel is now in the room \`${filteredRoomName}\``

    // It switched from another room to this one
    } else if (allConnectedChannels[channelID] !== filteredRoomName) {
      const oldRoom = allConnectedChannels[channelID]
      stopListeningForRolls(channelID, filteredRoomName)
      allConnectedChannels[channelID] = filteredRoomName
      saveConnectedChannels()
      listenForRolls(channelID, filteredRoomName)
      replyString = `This channel has switched from the room \`${oldRoom}\` to \`${filteredRoomName}\`.`

    } else {
      replyString = `This channel was already in the room \`${allConnectedChannels[channelID]}\`!`
    }
  }

  return replyString
}

function leaveCurrentRoom(channelID){
  console.log(`channel leaving room : ${channelID}`);
  const roomName = allConnectedChannels[channelID]

  let replyString = ''
  if (roomName) {
    replyString = `This channel has left the room \`${roomName}\`. It will no longer show rolls from Witchdice.`
    delete allConnectedChannels[channelID]
    saveConnectedChannels()
    stopListeningForRolls(channelID, roomName)
  } else {
    replyString = `Could not leave the room because I have no record for channel ID \`${channelID}\`.`
    console.log("ERROR: could not leave room ", channelID, " because I don't think we were in it!");
  }

  return replyString
}


function sayCurrentRoom(channelID){
  console.log(`Current room for channel : ${channelID}`);
  let replyString = ''
  const roomName = allConnectedChannels[channelID]

  if (roomName) {
    replyString = `This channel is listening to the room \`${roomName}\`. \n Make rolls on Witchdice at https://witchdice.com/simple?r=${roomName}`
  } else {
    replyString = 'This channel is not part of a Witchdice room. Join one with the \join-room command.'
  }

  return replyString
}


// ------------------------------------------------
// ------------ LISTENER MANAGEMENT ---------------
// ------------------------------------------------


// set up the listeners for a room
function listenForRolls(channelID, roomName) {
  console.log('    Creating listeners for room', roomName,' to channel ', channelID);

  // ======= ROLLS ======== //
  const dbRollsRef = database.ref().child('rolls').child(roomName)
  const addedListener = dbRollsRef.on('child_added', (snapshot) => {
    if (snapshot) {
      if (wasCreatedWithinLastMinute(snapshot.val().createdAt)) {
        console.log('child_added');
        const embed = messageMaker.makeRollMessage(snapshot.val(), roomName)
        sendMessagetoChannel(channelID, {embeds: [embed]})
      }
    }
  });

  const changedListener = dbRollsRef.on('child_changed', (snapshot) => {
    if (snapshot) {
      console.log('child_changed');
      const snapshotVal = snapshot.val()
      const embed = messageMaker.makeRollMessage(snapshotVal, roomName)
      const targetCreatedAt = snapshotVal['createdAt']
      editMessageInChannel(channelID, {embeds: [embed]}, targetCreatedAt)
    }
  });

  // ======= EMOTES ======== //
  const dbEmotesRef = database.ref().child('emotes').child(roomName)
  const emoteAddedListener = dbEmotesRef.on('child_added', (snapshot) => {
    if (snapshot) {
      if (wasCreatedWithinLastMinute(snapshot.val().time)) {
        console.log('child_added EMOTE');
        const embed = messageMaker.makeEmoteMessage(snapshot.key, snapshot.val(), roomName)
        sendMessagetoChannel(channelID, {embeds: [embed]})
      }
    }
  });

  const emoteChangedListener = dbEmotesRef.on('child_changed', (snapshot) => {
    if (snapshot) {
      console.log('child_changed EMOTE');
      const embed = messageMaker.makeEmoteMessage(snapshot.key, snapshot.val(), roomName)
      sendMessagetoChannel(channelID, {embeds: [embed]})
    }
  });

  // store references to these channels
  allConnectedChannelListeners[channelID] = {
    added: addedListener,
    changed: changedListener,
    emoteAdded: emoteAddedListener,
    emoteChanged: emoteChangedListener,
  }
}

// disables the listeners from a channel and removes it from the array
function stopListeningForRolls(channelID, roomName) {
  const channelListeners = allConnectedChannelListeners[channelID]
  if (channelListeners) {
    console.log('channelListeners',channelListeners);

    console.log('Stopping listeners for channel', channelID,);
    const dbRollsRef = database.ref().child('rolls').child(roomName)
    dbRollsRef.off('child_added', channelListeners.added)
    dbRollsRef.off('child_changed', channelListeners.changed)
    const dbEmotesRef = database.ref().child('emotes').child(roomName)
    dbEmotesRef.off('child_added', channelListeners.emoteAdded)
    dbEmotesRef.off('child_changed', channelListeners.emoteChanged)
    delete allConnectedChannelListeners[channelID]

  } else {
    console.error('Tried to remove listeners from channel', channelID, ', but they were not there!')
  }
}

// ------------------------------------
// ------------ UTILS ------------
// ------------------------------------

async function editMessageInChannel(channelID, message, targetCreatedAt) {
  const channel = client.channels.cache.get(channelID);
  const messages = await channel.messages.fetch({ limit: 20 })

  const targetTimeColor = rollParser.getColorFromTime(targetCreatedAt)
  const targetColorInt = parseInt(targetTimeColor, 16)


  const targetMessage = messages.find(message =>
    parseInt(message.author.id) === parseInt(clientId) &&
    message.embeds.length > 0 &&
    message.embeds[0].color === targetColorInt
    // message.embeds[0].footer &&
    // message.embeds[0].footer.text &&
    // message.embeds[0].footer.text.includes(targetCreatedAt)
  )

  if (targetMessage) {
    console.log('>>>>> EDIT',channelID,' ::: ',message);
    targetMessage.edit(message).catch(error =>
      console.error('Failed to edit! :', error)
    )
  }
}

function sendMessagetoChannel(channelID, message) {
  try {
    const channel = client.channels.cache.get(channelID);
    if (channel && message) {
      console.log('>>>>> SEND',channelID,' ::: ',message);
      channel.send(message).catch(error =>
    		console.error('Failed to send! ', error)
      );
    }
  } catch (e) {
    console.error('sendMessagetoChannel ERROR :', e)
  }
}

// on initial connection, we get a lot of old children. only show recent rolls.
function wasCreatedWithinLastMinute(createdAt) {
  var now = Date.now()
  var cutoff = now - 60 * 1000  // 60 seconds ago
  return (createdAt > cutoff)   // within the last 60 seconds
}

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
