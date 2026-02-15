const {
    Events,
    ChannelType,
    PermissionsBitField,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');

const TICKET_CATEGORY_ID = "1470459472253026315";
const STAFF_ROLE_ID = "1472068480932118591";
const LOG_CHANNEL_ID = "1470462339617657015";

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        try {

            /* =========================
               SLASH COMMANDS
            ========================== */
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;

                await command.execute(interaction, client);
                return;
            }

            /* =========================
               BUTTONS
            ========================== */
            if (!interaction.isButton()) return;

            console.log("Button clicked:", interaction.customId);

            /* ===== OPEN TICKET ===== */
            if (interaction.customId === 'open_ticket') {

                await interaction.deferReply({ ephemeral: true });

                const channel = await interaction.guild.channels.create({
                    name: `exchange-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    parent: TICKET_CATEGORY_ID,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages
                            ],
                        },
                        {
                            id: STAFF_ROLE_ID,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages
                            ],
                        },
                    ],
                });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('claim_ticket')
                        .setLabel('📌 Claim')
                        .setStyle(ButtonStyle.Primary),

                    new ButtonBuilder()
                        .setCustomId('complete_ticket')
                        .setLabel('💰 Complete')
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 Close')
                        .setStyle(ButtonStyle.Danger)
                );

                const embed = new EmbedBuilder()
                    .setTitle("💱 Exchange Ticket")
                    .setDescription(`User: ${interaction.user}\n\nStaff will assist you shortly.`)
                    .setColor("Green");

                await channel.send({
                    content: `<@&${STAFF_ROLE_ID}>`,
                    embeds: [embed],
                    components: [row]
                });

                await interaction.editReply({
                    content: `✅ Ticket created: ${channel}`
                });
            }

            /* ===== CLAIM ===== */
            if (interaction.customId === 'claim_ticket') {

                await interaction.reply({
                    content: `📌 Ticket claimed by ${interaction.user}`
                });
            }

            /* ===== COMPLETE ===== */
            if (interaction.customId === 'complete_ticket') {

                await interaction.reply({
                    content: `💰 Exchange marked completed by ${interaction.user}`
                });

                const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle("✅ Exchange Completed")
                        .setDescription(
                            `Ticket: ${interaction.channel}\nCompleted by: ${interaction.user}`
                        )
                        .setColor("Blue")
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

            /* ===== CLOSE ===== */
            if (interaction.customId === 'close_ticket') {

                await interaction.reply({
                    content: "🔒 Closing ticket in 5 seconds..."
                });

                setTimeout(() => {
                    interaction.channel.delete().catch(() => {});
                }, 5000);
            }

        } catch (error) {
            console.error("INTERACTION ERROR:", error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "❌ Something went wrong.",
                    ephemeral: true
                });
            }
        }
    },
};