const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const data = require('./data');

const CHANNEL_ID = '1470462339617657015';

function sortBy(field) {
    return Object.entries(data.staffStats)
        .sort((a, b) => (b[1][field] || 0) - (a[1][field] || 0))
        .slice(0, 3);
}

function startDailyLeaderboard(client) {
    cron.schedule('0 0 * * *', async () => { // Every day at midnight (server time)

        const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
        if (!channel) return;

        const profitTop = sortBy('profit');
        const volumeTop = sortBy('volume');
        const ticketsTop = sortBy('tickets');

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('💎 Daily Staff Performance Report 💎')
            .setDescription(`📅 ${new Date().toDateString()}`)
            .addFields(
                {
                    name: '🥇 Top Profit',
                    value: profitTop.length
                        ? profitTop.map((u, i) => `${i + 1}. <@${u[0]}> — **$${u[1].profit || 0}**`).join('\n')
                        : 'No data'
                },
                {
                    name: '💵 Top Volume',
                    value: volumeTop.length
                        ? volumeTop.map((u, i) => `${i + 1}. <@${u[0]}> — **$${u[1].volume || 0}**`).join('\n')
                        : 'No data'
                },
                {
                    name: '🎟️ Most Tickets',
                    value: ticketsTop.length
                        ? ticketsTop.map((u, i) => `${i + 1}. <@${u[0]}> — **${u[1].tickets || 0} Tickets**`).join('\n')
                        : 'No data'
                }
            )
            .setFooter({
                text: `Total Volume: $${data.totalVolume} | Total Profit: $${data.totalProfit}`
            });

        channel.send({ embeds: [embed] });

    });
}

module.exports = { startDailyLeaderboard };