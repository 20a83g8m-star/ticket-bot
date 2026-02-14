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
    GatewayIntentBits.GuildMessages
  ]
});

const CHANNEL_ID = '1470460038266224731'; // Your channel ID

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);

  const embed = new EmbedBuilder()
    .setTitle('🎫 Support Tickets')
    .setDescription('Click the button below to open a support ticket.')
    .setColor('Blue');

  const button = new ButtonBuilder()
    .setCustomId('open_ticket')
    .setLabel('Open Ticket')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  await channel.send({
    embeds: [embed],
    components: [row]
  });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  // OPEN TICKET
  if (interaction.customId === 'open_ticket') {

    const existing = interaction.guild.channels.cache.find(
      ch => ch.name === `ticket-${interaction.user.id}`
    );

    if (existing) {
      return interaction.reply({
        content: '❌ You already have an open ticket!',
        ephemeral: true
      });
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.id}`,
      type: 0,
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
        }
      ]
    });

    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger);

    const closeRow = new ActionRowBuilder().addComponents(closeButton);

    await channel.send({
      content: `🎫 ${interaction.user}, your ticket has been created.`,
      components: [closeRow]
    });

    await interaction.reply({
      content: `✅ Ticket created: ${channel}`,
      ephemeral: true
    });
  }

  // CLOSE TICKET
  if (interaction.customId === 'close_ticket') {
    await interaction.reply({ content: '🔒 Closing ticket...', ephemeral: true });

    setTimeout(() => {
      interaction.channel.delete();
    }, 3000);
  }
});

client.login(process.env.TOKEN);