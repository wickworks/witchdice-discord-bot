module.exports = {
  name: '~join',
  description: 'Show rolls from Witchdice room in the current channel.',

  execute(msg, args) {
    console.log(`Joining room : ${args} from message : ${msg}`);

    room_name = args[0]

    // msg.reply('pong');
    msg.channel.send(`You've joined the room : ${room_name}`);
  },
};
