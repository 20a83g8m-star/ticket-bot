const {
    Events,
    ChannelType,
    PermissionsBitField,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const TICKET_CATEGORY_ID = "1470459472253026315";
const STAFF_ROLE_ID = "1472068480932118591";
const LOG_CHANNEL_ID = "1470462339617657015";

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        try {

            /* ================= SLASH ================= */
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;
                await command.execute(interaction, client);
                return;
            }

            /* ================= BUTTONS ================= */
            if (interaction.isButton()) {

                const exchangeTypes = ['cashapp', 'paypal', 'crypto'];

                if (exchangeTypes.includes(interaction.customId)) {

                    const modal = new ModalBuilder()
                        .setCustomId(`modal_${interaction.customId}`)
                        .setTitle('Exchange Details');

                    const amountInput = new TextInputBuilder()
                        .setCustomId('amount')
                        .setLabel('Amount')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const detailsInput = new TextInputBuilder()
                        .setCustomId('details')
                        .setLabel('Exchange Details')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true);

                    const row1 = new ActionRowBuilder().addComponents(amountInput);
                    const row2 = new ActionRowBuilder().addComponents(detailsInput);

                    modal.addComponents(row1, row2);

                    await interaction.showModal(modal);
                }

                if (interaction.customId === 'claim_ticket') {
                    await interaction.reply({ content: `📌 Claimed by ${interaction.user}` });
                }

                if (interaction.customId === 'close_ticket') {
                    await interaction.reply({ content: "🔒 Closing..." });
                    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
                }
            }

            /* ================= MODAL SUBMIT ================= */
            if (interaction.isModalSubmit()) {

                if (!interaction.customId.startsWith('modal_')) return;

                const exchangeType = interaction.customId.replace('modal_', '');
                const amount = interaction.fields.getTextInputValue('amount');
                const details = interaction.fields.getTextInputValue('details');

                await interaction.deferReply({ ephemeral: true });

                const channel = await interaction.guild.channels.create({
                    name: `${exchangeType}-${interaction.user.username}`,
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

                const embed = new EmbedBuilder()
                    .setTitle("💱 Exchange Ticket")
                    .setColor("Green")
                    .addFields(
                        { name: "User", value: `${interaction.user}`, inline: true },
                        { name: "Type", value: exchangeType.toUpperCase(), inline: true },
                        { name: "Amount", value: amount },
                        { name: "Details", value: details }
                    );

                const controlRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('claim_ticket')
                        .setLabel('📌 Claim')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 Close')
                        .setStyle(ButtonStyle.Danger)
                );

                await channel.send({
                    content: `<@&${STAFF_ROLE_ID}>`,
                    embeds: [embed],
                    components: [controlRow]
                });

                await interaction.editReply({
                    content: `✅ Ticket created: ${channel}`
                });
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