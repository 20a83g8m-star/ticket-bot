const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  PermissionsBitField, 
  ChannelType,
  SlashCommandBuilder,
  Routes,
  REST
} = require('discord.js');

const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1472057853333213274';
const OWNER_ID = '1377661811377049807';
const STAFF_ROLE_ID = '1472068480932118591';
const CATEGORY_ID = '1470459472253026315';
const LOG_CHANNEL_ID = '1470921582217007216';
const FEE_PERCENT = 5;

let data = {
  counter: 1,
  totalVolume: 0,
  totalProfit: 0,
  staffStats: {}
};

if (fs.existsSync('./data.json')) {
  data = JSON.parse(fs.readFileSync('./data.json'));
}

function saveData() {
  fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('panel')
      .setDescription('Send exchange panel'),
    new SlashCommandBuilder()
      .setName('business')
      .setDescription('View business stats'),
    new SlashCommandBuilder()
      .setName('stats')
      .setDescription('View staff stats')
      .addUserOption(option =>
        option.setName('staff')
          .setDescription('Select staff')
          .setRequired(true))
  ];

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );
});

client.on('interactionCreate', async interaction => {

  // PANEL COMMAND
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === 'panel') {

      const embed = new EmbedBuilder()
        .setTitle('💱 Exchange Service')
        .setDescription('Select your exchange type below.\n\n⚠️ Do NOT send funds until instructed by staff.')
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

      await interaction.reply({ embeds: [embed], components: [row] });
    }

    // BUSINESS STATS
    if (interaction.commandName === 'business') {
      if (interaction.user.id !== OWNER_ID)
        return interaction.reply({ content: 'Owner only.', ephemeral: true });

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

    // STAFF STATS
    if (interaction.commandName === 'stats') {
      const user = interaction.options.getUser('staff');
      const stats = data.staffStats[user.id];

      if (!stats)
        return interaction.reply({ content: 'No stats found.', ephemeral: true });

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
  }

  // BUTTONS
  if (interaction.isButton()) {

    if (['cashapp','paypal','crypto'].includes(interaction.customId)) {

      const modal = new ModalBuilder()
        .setCustomId(`modal_${interaction.customId}`)
        .setTitle('Exchange Form');

      const amountInput = new TextInputBuilder()
        .setCustomId('amount')
        .setLabel('Amount ($)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const fromInput = new TextInputBuilder()
        .setCustomId('from')
        .setLabel('From')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const toInput = new TextInputBuilder()
        .setCustomId('to')
        .setLabel('To')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(amountInput),
        new ActionRowBuilder().addComponents(fromInput),
        new ActionRowBuilder().addComponents(toInput)
      );

      await interaction.showModal(modal);
    }

    if (interaction.customId === 'claim') {
      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID))
        return interaction.reply({ content: 'Staff only.', ephemeral: true });

      await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
        SendMessages: true
      });

      await interaction.reply(`🔒 Claimed by ${interaction.user}`);
    }

    if (interaction.customId === 'close') {
      await interaction.reply({
        content: 'Confirm close?',
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('confirm_close')
              .setLabel('Confirm')
              .setStyle(ButtonStyle.Danger)
          )
        ]
      });
    }

    if (interaction.customId === 'confirm_close') {

      const channel = interaction.channel;
      const messages = await channel.messages.fetch({ limit: 100 });

      let transcript = '';
      messages.reverse().forEach(m => {
        transcript += `${m.author.tag}: ${m.content}\n`;
      });

      fs.writeFileSync(`./transcript-${channel.name}.txt`, transcript);

      const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

      await logChannel.send({
        content: `🧾 Transcript for ${channel.name}`,
        files: [`./transcript-${channel.name}.txt`]
      });

      await channel.delete();
    }
  }

  // MODAL SUBMIT
  if (interaction.isModalSubmit()) {

    const amount = parseFloat(interaction.fields.getTextInputValue('amount'));
    const from = interaction.fields.getTextInputValue('from');
    const to = interaction.fields.getTextInputValue('to');

    const fee = amount * (FEE_PERCENT / 100);
    const net = amount - fee;

    data.totalVolume += amount;
    data.totalProfit += fee;
    saveData();

    const ticketNumber = String(data.counter++).padStart(3, '0');
    saveData();

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
      .setTitle(`💱 Exchange #${ticketNumber}`)
      .setDescription(`From: ${from}\nTo: ${to}\nAmount: $${amount}\nFee (5%): $${fee.toFixed(2)}\nNet: $${net.toFixed(2)}`)
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

});

client.login(TOKEN);