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
    .setTitle('💱 Exchange Service')
    .setDescription('Select your exchange type below.')
    .setColor('Green');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('cashapp')
      .setLabel('CashApp')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('paypal')
      .setLabel('PayPal')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('crypto')
      .setLabel('Crypto')
      .setStyle(ButtonStyle.Secondary)
  );

  await panelChannel.send({ embeds: [embed], components: [row] });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const logs = await client.channels.fetch(LOG_CHANNEL);

  // ===== OPEN EXCHANGE =====
  if (['cashapp', 'paypal', 'crypto'].includes(interaction.customId)) {

    const existing = interaction.guild.channels.cache.find(
      ch => ch.name.includes(interaction.user.id)
    );

    if (existing)
      return interaction.reply({ content: '❌ You already have an open exchange!', ephemeral: true });

    const number = String(ticketCounter++).padStart(3, '0');

    const channel = await interaction.guild.channels.create({
      name: `exchange-${number}`,
      type: 0,
      parent: CATEGORY_ID,
      topic: `User: ${interaction.user.id}`,
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

    const infoEmbed = new EmbedBuilder()
      .setTitle(`💱 ${interaction.customId.toUpperCase()} Exchange`)
      .setDescription(`
Please fill out the format below:

Amount:
From:
To:
Rate Agreed:
Proof Screenshot:
      `)
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
      content: `<@&${STAFF_ROLE}> New exchange opened by ${interaction.user}`,
      embeds: [infoEmbed],
      components: [controlRow]
    });

    await logs.send(`📂 Exchange ${channel.name} opened by ${interaction.user.tag}`);

    await interaction.reply({ content: `✅ Exchange created: ${channel}`, ephemeral: true });
  }

  // ===== CLAIM =====
  if (interaction.customId === 'claim') {

    if (!interaction.member.roles.cache.has(STAFF_ROLE))
      return interaction.reply({ content: '❌ Staff only.', ephemeral: true });

    if (interaction.channel.name.includes('-claimed'))
      return interaction.reply({ content: '❌ Already claimed.', ephemeral: true });

    await interaction.channel.setName(`${interaction.channel.name}-claimed`);

    await interaction.reply({ content: `👮 Claimed by ${interaction.user}` });

    await logs.send(`📝 ${interaction.channel.name} claimed by ${interaction.user.tag}`);
  }

  // ===== CLOSE =====
  if (interaction.customId === 'close') {

    if (!interaction.member.roles.cache.has(STAFF_ROLE))
      return interaction.reply({ content: '❌ Staff only.', ephemeral: true });

    await interaction.reply({ content: '🔒 Closing & saving transcript...', ephemeral: true });

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
        name: `${interaction.channel.name}.txt`
      }]
    });

    await logs.send(`🔒 ${interaction.channel.name} closed by ${interaction.user.tag}`);

    setTimeout(() => interaction.channel.delete(), 3000);
  }
});

client.login(process.env.TOKEN);