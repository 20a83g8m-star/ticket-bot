const {
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionsBitField
} = require('discord.js');

const data = require('../utils/data');

const STAFF_ROLE_ID = '1472068480932118591';
const LOG_CHANNEL_ID = '1470921582217007216';
const TICKET_CATEGORY_ID = '1470459472253026315';

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        // 🔹 Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ Error executing command.', ephemeral: true });
            }
        }

        // 🔹 Button Handling
        if (!interaction.isButton()) return;

        // =============================
        // 🎟️ CREATE TICKET BUTTON
        // =============================
        if (interaction.customId === 'open_ticket') {

            const channel = await interaction.guild.channels.create({
                name: `exchange-${data.counter}`,
                type: 0,
                parent: TICKET_CATEGORY_ID,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    },
                    {
                        id: STAFF_ROLE_ID,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    }
                ],
            });

            data.counter++;
            data.save();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('claim')
                    .setLabel('📌 Claim')
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('complete')
                    .setLabel('💰 Complete Exchange')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId('close')
                    .setLabel('🔒 Close')
                    .setStyle(ButtonStyle.Danger)
            );

            await channel.send({
                content: `🎟️ Exchange Ticket Opened by ${interaction.user}`,
                components: [row]
            });

            await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
        }

        // =============================
        // 📌 CLAIM BUTTON
        // =============================
        if (interaction.customId === 'claim') {

            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Staff only.', ephemeral: true });
            }

            if (interaction.channel.topic) {
                return interaction.reply({ content: '❌ Ticket already claimed.', ephemeral: true });
            }

            await interaction.channel.setTopic(interaction.user.id);

            await interaction.reply(`✅ Ticket claimed by ${interaction.user}`);
        }

        // =============================
        // 💰 COMPLETE BUTTON
        // =============================
        if (interaction.customId === 'complete') {

            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Staff only.', ephemeral: true });
            }

            const claimedBy = interaction.channel.topic;

            if (!claimedBy) {
                return interaction.reply({ content: '❌ Ticket must be claimed first.', ephemeral: true });
            }

            if (claimedBy !== interaction.user.id) {
                return interaction.reply({ content: '❌ Only the claiming staff can complete this.', ephemeral: true });
            }

            await interaction.reply({ content: '💵 Enter the total exchange amount in chat.', ephemeral: true });

            const filter = m => m.author.id === interaction.user.id;
            const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

            collector.on('collect', async msg => {

                const amount = parseFloat(msg.content);
                if (isNaN(amount)) return msg.reply('❌ Invalid number.');

                const fee = amount * 0.05;

                if (!data.staffStats[interaction.user.id]) {
                    data.staffStats[interaction.user.id] = {
                        tickets: 0,
                        volume: 0,
                        profit: 0
                    };
                }

                data.staffStats[interaction.user.id].tickets += 1;
                data.staffStats[interaction.user.id].volume += amount;
                data.staffStats[interaction.user.id].profit += fee;

                data.totalVolume += amount;
                data.totalProfit += fee;

                data.save();

                await msg.reply(`🎉 Exchange Completed!\n💵 Amount: $${amount}\n💰 5% Fee: $${fee.toFixed(2)}`);
            });
        }

        // =============================
        // 🔒 CLOSE BUTTON
        // =============================
        if (interaction.customId === 'close') {

            const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);

            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('📁 Ticket Closed')
                    .setDescription(`Channel: ${interaction.channel.name}`)
                    .addFields(
                        { name: 'Closed By', value: `${interaction.user}`, inline: true },
                        { name: 'Claimed By', value: interaction.channel.topic ? `<@${interaction.channel.topic}>` : 'Not claimed', inline: true }
                    )
                    .setTimestamp();

                logChannel.send({ embeds: [embed] });
            }

            await interaction.reply('🔒 Closing ticket...');
            setTimeout(() => interaction.channel.delete(), 3000);
        }
    }
};