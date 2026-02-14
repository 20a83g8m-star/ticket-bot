module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Error executing command.', ephemeral: true });
      }
    }

    // Buttons & Modals (handled in ticketManager later)
    if (interaction.isButton() || interaction.isModalSubmit()) {
      const ticketManager = require('../utils/ticketManager');
      ticketManager.handleInteraction(interaction, client);
    }
  }
};