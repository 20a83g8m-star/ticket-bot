const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Send the exchange panel'),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle('💱 Exchange Service')
      .setDescription(
        'Select your exchange type below.\n\n' +
        '⚠️ Do NOT send funds until instructed by staff.\n' +
        '⚠️ Only trust official staff members.'
      )
      .setColor('Green');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('cashapp')
        .setLabel('CashApp')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('paypal')
        .setLabel('PayPal')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('crypto')
        .setLabel('Crypto')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};