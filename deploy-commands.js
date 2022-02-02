const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

const commands = [
	new SlashCommandBuilder()
    .setName('join-room')
    .setDescription('Sets up the current channel to recieve dice rolls from a Witchdice room.')
    .addStringOption(option => option
      .setName('room')
      .setDescription('Name of the room to join (matching the one you have on Witchdice).')
      .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('current-room')
    .setDescription('Returns the name of the room the current channel is listening to.'),
	// new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
	// new SlashCommandBuilder().setName('user').setDescription('Replies with user info!'),
].map(command => command.toJSON());

console.log('COMMANDS:');
console.log(commands);

const rest = new REST({ version: '9' }).setToken(token);

// console.log('Registering global slash command...');
// rest.put(Routes.applicationCommands(clientId), { body: commands })
//   .then(() => console.log('Successfully registered application commands.'))
//   .catch(console.error);;

console.log('Registering guild slash command...');
rest.put(
	Routes.applicationGuildCommands(clientId, guildId),
	{ body: commands },
);
