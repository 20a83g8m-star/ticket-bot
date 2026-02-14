const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const data = require('./data');

async function sendRatingPrompt(user, staffId) {

  try {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rate_${staffId}_1`)
        .setLabel('⭐ 1')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`rate_${staffId}_2`)
        .setLabel('⭐ 2')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`rate_${staffId}_3`)
        .setLabel('⭐ 3')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`rate_${staffId}_4`)
        .setLabel('⭐ 4')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`rate_${staffId}_5`)
        .setLabel('⭐ 5')
        .setStyle(ButtonStyle.Success)
    );

    await user.send({
      content: '⭐ Rate your exchange experience:',
      components: [row]
    });

  } catch (err) {
    console.log('Could not DM user.');
  }
}

function handleRating(interaction) {

  if (!interaction.customId.startsWith('rate_')) return false;

  const parts = interaction.customId.split('_');
  const staffId = parts[1];
  const rating = parseInt(parts[2]);

  if (!data.staffStats[staffId]) {
    data.staffStats[staffId] = {
      tickets: 0,
      volume: 0,
      rating: 0,
      ratingsCount: 0
    };
  }

  const staff = data.staffStats[staffId];

  staff.rating =
    ((staff.rating * staff.ratingsCount) + rating) /
    (staff.ratingsCount + 1);

  staff.ratingsCount += 1;

  data.save();

  interaction.reply({ content: '✅ Rating submitted. Thank you!', ephemeral: true });

  return true;
}

module.exports = { sendRatingPrompt, handleRating };