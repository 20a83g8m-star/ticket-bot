const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data = require('../utils/data');

const OWNER_ID = '1377661811377049807';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('business')
    .setDescription('View business statistics'),

  async execute(interaction) {

    if (interaction.user.id !== OWNER_ID)
      return interaction.reply({ content: 'Owner only command.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('📊 Business Stats')
      .addFields(
        { name: 'Total Volume', value: `$${data.totalVolume.toFixed(2)}` },
        { name: 'Total Profit (5%)', value: `$${data.totalProfit.toFixed(2)}` },
        { name: 'Total Tickets', value: `${data.counter - 1}` }
      )
      .setColor('Blue');

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};