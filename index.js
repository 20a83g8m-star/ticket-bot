const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// ===== CONFIG =====
const CATEGORY_ID = '1470459472253026315';
const LOG_CHANNEL = '1470921582217007216';
const STAFF_ROLE = '1472068480932118591';
const PANEL_CHANNEL = '1470460038266224731';
// ===================

let ticketCounter = 1;

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const panelChannel = await client.channels.fetch(PANEL_CHANNEL);

  const embed = new EmbedBuilder()
    .setTitle('💱 Official Exchange Service')
    .setDescription(`
Please choose your exchange type below.

⚠️ Do NOT send funds until instructed.
⚠️ Only trust official staff.
⚠️ Provide valid proof.
    `)
    .setColor('Green');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('cashapp')
      .setLabel('CashApp Exchange')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('paypal')
      .setLabel('PayPal Exchange')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('crypto')
      .setLabel('Crypto Exchange')
      .setStyle(ButtonStyle.Secondary)
  );

  await panelChannel.send({ embeds: [embed], components: [row] });
});

client.on('interactionCreate', async interaction => {

  // ===== BUTTON → SHOW FORM =====
  if (interaction.isButton()) {

    if (!['cashapp','paypal','crypto'].includes(interaction.customId)) return;

    const modal = new ModalBuilder()
      .setCustomId(`form_${interaction.customId}`)
      .setTitle('Exchange Details');

    const amount = new TextInputBuilder()
      .setCustomId('amount')
      .setLabel('Exchange Amount')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const from = new TextInputBuilder()
      .setCustomId('from')
      .setLabel('From Payment Method')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const to = new TextInputBuilder()
      .setCustomId('to')
      .setLabel('To Payment Method')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const rate = new TextInputBuilder()
      .setCustomId('rate')
      .setLabel('Agreed Rate')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(amount),
      new ActionRowBuilder().addComponents(from),
      new ActionRowBuilder().addComponents(to),
      new ActionRowBuilder().addComponents(rate)
    );

    await interaction.showModal(modal);
  }

  // ===== FORM SUBMIT =====
  if (interaction.isModalSubmit()) {

    const type = interaction.customId.split('_')[1];

    const amount = interaction.fields.getTextInputValue('amount');
    const from = interaction.fields.getTextInputValue('from');
    const to = interaction.fields.getTextInputValue('to');
    const rate = interaction.fields.getTextInputValue('rate');

    const number = String(ticketCounter++).padStart(3, '0');

    const channel = await interaction.guild.channels.create({
      name: `exchange-${number}`,
      type: 0,
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
          id: STAFF_ROLE,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle(`💱 ${type.toUpperCase()} Exchange`)
      .addFields(
        { name: 'Amount', value: amount },
        { name: 'From', value: from },
        { name: 'To', value: to },
        { name: 'Rate', value: rate }
      )
      .setColor('Blue');

    const controlRow = new ActionRowBuilder().addComponents(
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
      content: `<@&${STAFF_ROLE}> New exchange from ${interaction.user}`,
      embeds: [embed],
      components: [controlRow]
    });

    await interaction.reply({
      content: `✅ Exchange created: ${channel}`,
      ephemeral: true
    });
  }

});

client.login(process.env.TOKEN);