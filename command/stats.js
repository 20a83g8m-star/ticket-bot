const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data = require('../utils/data');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View staff stats')
    .addUserOption(option =>
      option.setName('staff')
        .setDescription('Select staff member')
        .setRequired(true)
    ),

  async execute(interaction) {

    const user = interaction.options.getUser('staff');
    const stats = data.staffStats[user.id];

    if (!stats) {
      return interaction.reply({ content: 'No stats found for this staff member.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📈 Stats for ${user.username}`)
      .addFields(
        { name: 'Tickets Handled', value: `${stats.tickets}` },
        { name: 'Total Volume', value: `$${stats.volume.toFixed(2)}` },
        { name: 'Average Rating', value: `${stats.rating || 'N/A'}` }
      )
      .setColor('Purple');

    await interaction.reply({ embeds: [embed] });
  }
};