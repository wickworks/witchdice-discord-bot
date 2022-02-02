const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Joins a Witchdice room so the rolls show up here.!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
