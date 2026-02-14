const { REST, Routes } = require('discord.js');

const CLIENT_ID = '1472057853333213274';

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    const commands = [];
    client.commands.forEach(command => {
      commands.push(command.data.toJSON());
    });

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Slash commands registered.');
    } catch (error) {
      console.error(error);
    }
  }
};