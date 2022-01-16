const { Client, Intents } = require('discord.js');


exports.makeClient = (config, service) => {
    console.log("MAKE ZONE CLIENT");

    const client = new Client({
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_VOICE_STATES
        ],
    });

    service.setClient(client);

    client.once('ready', async (message) => {
        try {
            console.log("READY MESSAGE");
            await service.run(config);
        } catch (error) {
            console.error(error);
        }
    });


    client.on('messageCreate', async (message) => {
        // Ignore messages from different guild
        if (!message.guild) return;

        // Ignore messages sent by bots
        if (message.author.bot) return;

        console.log("MESSAGE");
        console.log("- content:" + message.content);
        console.log("- channel:" + message.channelId);
        console.log("- author: " + message.author.username);
        console.log("-----------------------");

        // Parse it, yo
        await service.readMessage(message);
    });

    return client;
}
