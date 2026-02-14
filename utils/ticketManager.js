const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

const data = require('./data');
const fs = require('fs');

const STAFF_ROLE_ID = '1472068480932118591';
const CATEGORY_ID = '1470459472253026315';
const LOG_CHANNEL_ID = '1470921582217007216';
const FEE_PERCENT = 5;

async function handleInteraction(interaction, client) {

  // === OPEN MODAL ===
  if (interaction.isButton() &&
      ['cashapp','paypal','crypto'].includes(interaction.customId)) {

    const modal = new ModalBuilder()
      .setCustomId(`exchange_${interaction.customId}`)
      .setTitle('Exchange Form');

    const amount = new TextInputBuilder()
      .setCustomId('amount')
      .setLabel('Amount ($)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const from = new TextInputBuilder()
      .setCustomId('from')
      .setLabel('From')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const to = new TextInputBuilder()
      .setCustomId('to')
      .setLabel('To')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(amount),
      new ActionRowBuilder().addComponents(from),
      new ActionRowBuilder().addComponents(to)
    );

    return interaction.showModal(modal);
  }

  // === CREATE TICKET ===
  if (interaction.isModalSubmit() && interaction.customId.startsWith('exchange_')) {

    const type = interaction.customId.split('_')[1];
    const amount = parseFloat(interaction.fields.getTextInputValue('amount'));
    const from = interaction.fields.getTextInputValue('from');
    const to = interaction.fields.getTextInputValue('to');

    const fee = amount * (FEE_PERCENT / 100);
    const net = amount - fee;

    const ticketNumber = String(data.counter++).padStart(3, '0');

    data.totalVolume += amount;
    data.totalProfit += fee;
    data.save();

    const channel = await interaction.guild.channels.create({
      name: `exchange-${ticketNumber}`,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        },
        {
          id: STAFF_ROLE_ID,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle(`💱 Exchange #${ticketNumber} (${type})`)
      .setDescription(
        `From: ${from}\n` +
        `To: ${to}\n` +
        `Amount: $${amount}\n` +
        `Fee (5%): $${fee.toFixed(2)}\n` +
        `Net: $${net.toFixed(2)}`
      )
      .setColor('Green');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('claim')
        .setLabel('Claim')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('close')
        .setLabel('Close')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `<@&${STAFF_ROLE_ID}>`,
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });
  }

  // === CLAIM SYSTEM ===
  if (interaction.isButton() && interaction.customId === 'claim') {

    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID))
      return interaction.reply({ content: 'Staff only.', ephemeral: true });

    await interaction.channel.permissionOverwrites.edit(STAFF_ROLE_ID, {
      SendMessages: false
    });

    await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
      SendMessages: true
    });

    await interaction.reply(`🔒 Claimed by ${interaction.user}`);
  }

  // === CLOSE SYSTEM ===
  if (interaction.isButton() && interaction.customId === 'close') {

    const messages = await interaction.channel.messages.fetch({ limit: 100 });

    let transcript = '';
    messages.reverse().forEach(m => {
      transcript += `${m.author.tag}: ${m.content}\n`;
    });

    const fileName = `transcript-${interaction.channel.name}.txt`;
    fs.writeFileSync(fileName, transcript);

    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

    await logChannel.send({
      content: `🧾 Transcript for ${interaction.channel.name}`,
      files: [fileName]
    });

    await interaction.channel.delete();
  }
}

module.exports = { handleInteraction };