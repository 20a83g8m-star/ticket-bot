const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ====== CONFIG ======
const TICKET_CATEGORY = '1470459472253026315';
const LOG_CHANNEL = '1470921582217007216';
const STAFF_ROLE = '1472068480932118591';
const PANEL_CHANNEL = '1470460038266224731';
// =====================

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const panelChannel = await client.channels.fetch(PANEL_CHANNEL);

  const embed = new EmbedBuilder()
    .setTitle('🎫 Support Tickets')
    .setDescription('Click the button below to open a ticket.')
    .setColor('Blue');

  const openBtn = new ButtonBuilder()
    .setCustomId('open_ticket')
    .setLabel('Open Ticket')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(openBtn);

  await panelChannel.send({ embeds: [embed], components: [row] });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const logs = await client.channels.fetch(LOG_CHANNEL);

  // ================= OPEN TICKET =================
  if (interaction.customId === 'open_ticket') {

    const existing = interaction.guild.channels.cache.find(
      ch => ch.name === `ticket-${interaction.user.id}`
    );

    if (existing)
      return interaction.reply({
        content: '❌ You already have an open ticket!',
        ephemeral: true
      });

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.id}`,
      type: 0,
      parent: TICKET_CATEGORY,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        },
        {
          id: STAFF_ROLE,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        }
      ]
    });

    const claimBtn = new ButtonBuilder()
      .setCustomId('claim_ticket')
      .setLabel('Claim')
      .setStyle(ButtonStyle.Success);

    const closeBtn = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(claimBtn, closeBtn);

    await channel.send({
      content: `🎫 ${interaction.user} | A staff member will assist you shortly.`,
      components: [row]
    });

    await logs.send(`📂 Ticket Opened by ${interaction.user.tag}`);

    await interaction.reply({
      content: `✅ Ticket created: ${channel}`,
      ephemeral: true
    });
  }

  // ================= CLAIM =================
  if (interaction.customId === 'claim_ticket') {

    if (!interaction.member.roles.cache.has(STAFF_ROLE))
      return interaction.reply({
        content: '❌ Only staff can claim tickets.',
        ephemeral: true
      });

    if (interaction.channel.topic)
      return interaction.reply({
        content: '❌ This ticket has already been claimed.',
        ephemeral: true
      });

    await interaction.channel.setTopic(`Claimed by ${interaction.user.tag}`);

    await interaction.reply({
      content: `👮 Ticket claimed by ${interaction.user}`,
      ephemeral: false
    });

    await logs.send(`📝 Ticket claimed by ${interaction.user.tag}`);
  }

  // ================= CLOSE =================
  if (interaction.customId === 'close_ticket') {

    if (!interaction.member.roles.cache.has(STAFF_ROLE))
      return interaction.reply({
        content: '❌ Only staff can close tickets.',
        ephemeral: true
      });

    await interaction.reply({
      content: '🔒 Saving transcript...',
      ephemeral: true
    });

    let transcript = `Transcript for ${interaction.channel.name}\n\n`;

    let lastId;
    while (true) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;

      const messages = await interaction.channel.messages.fetch(options);
      if (messages.size === 0) break;

      messages.forEach(msg => {
        transcript += `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content || "[Embed/Attachment]"}\n`;
      });

      lastId = messages.last().id;
    }

    await logs.send({
      content: `📁 Transcript from ${interaction.channel.name}`,
      files: [{
        attachment: Buffer.from(transcript, 'utf-8'),
        name: `${interaction.channel.name}-transcript.txt`
      }]
    });

    await logs.send(`🔒 Ticket closed by ${interaction.user.tag}`);

    setTimeout(() => {
      interaction.channel.delete();
    }, 3000);
  }

});

client.login(process.env.TOKEN);