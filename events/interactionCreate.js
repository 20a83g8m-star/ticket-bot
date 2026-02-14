module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // ===== SLASH COMMANDS =====
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'Error executing command.', ephemeral: true });
        } else {
          await interaction.reply({ content: 'Error executing command.', ephemeral: true });
        }
      }
    }

    // ===== BUTTONS & MODALS =====
    if (interaction.isButton() || interaction.isModalSubmit()) {

      // Handle Rating First
      const ratingSystem = require('../utils/ratingSystem');
      const handled = ratingSystem.handleRating(interaction);
      if (handled) return;

      // Then Handle Tickets
      const ticketManager = require('../utils/ticketManager');
      await ticketManager.handleInteraction(interaction, client);
    }
  }
};