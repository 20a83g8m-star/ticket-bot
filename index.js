const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

/* =========================
   LOAD COMMANDS
========================= */

const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Loaded command: ${command.data.name}`);
        }
    }
} else {
    console.log("⚠️ No commands folder found.");
}

/* =========================
   LOAD EVENTS
========================= */

const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const event = require(`./events/${file}`);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }

        console.log(`✅ Loaded event: ${event.name}`);
    }
} else {
    console.log("⚠️ No events folder found.");
}

/* =========================
   READY EVENT
========================= */

client.once('ready', () => {
    console.log(`🚀 Logged in as ${client.user.tag}`);
});

/* =========================
   GLOBAL ERROR HANDLING
========================= */

client.on('error', (error) => {
    console.error('Client Error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

/* =========================
   LOGIN
========================= */

client.login(process.env.TOKEN);