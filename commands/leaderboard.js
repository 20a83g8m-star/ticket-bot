const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data = require('../utils/data');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View top staff leaderboard'),

  async execute(interaction) {

    const sorted = Object.entries(data.staffStats)
      .sort((a, b) => b[1].volume - a[1].volume)
      .slice(0, 5);

    if (sorted.length === 0) {
      return interaction.reply({ content: 'No staff data yet.', ephemeral: true });
    }

    let description = '';

    sorted.forEach((entry, index) => {
      description += `**${index + 1}.** <@${entry[0]}> — $${entry[1].volume.toFixed(2)}\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle('🏆 Staff Leaderboard')
      .setDescription(description)
      .setColor('Gold');

    await interaction.reply({ embeds: [embed] });
  }
};