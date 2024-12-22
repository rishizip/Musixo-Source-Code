const { Riffy } = require("riffy");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const { queueNames, requesters } = require("./commands/play");
const { Dynamic } = require("musicard");
const config = require("./config.js"); // Import config
const fs = require("fs");
const path = require("path");

function initializePlayer(client) {
    // Retrieve node configuration from config.js
    const nodes = config.nodes.map(node => ({
        name: node.identifier,
        host: node.host,
        port: node.port,
        password: node.password,
        secure: node.secure,
        reconnectTimeout: node.reconnectTimeout,
        reconnectTries: node.reconnectTries
    }));

    // Initialize Riffy with the node configuration
    client.riffy = new Riffy(client, nodes, {
        send: (payload) => {
            const guildId = payload.d.guild_id;
            if (!guildId) return;

            const guild = client.guilds.cache.get(guildId);
            if (guild) guild.shard.send(payload);
        },
        defaultSearchPlatform: "ytmsearch",
        restVersion: "v4",
    });

    // Define the handleNodeConnect function
    function handleNodeConnect(node) {
        console.log(`Node "${node.name}" connected.`);
    }

    // Bind the event listener
    client.riffy.on("nodeConnect", handleNodeConnect);

    let currentTrackMessageId = null;
    let collector = null;

    client.riffy.on("nodeError", (node, error) => {
        console.error(`Node "${node.name}" encountered an error: ${error.message}.`);
    });

    client.riffy.on("trackStart", async (player, track) => {
        const channel = client.channels.cache.get(player.textChannel);
        const trackUri = track.info.uri;
        const requester = requesters.get(trackUri);

        try {
            // Log start of music card creation
            console.log("Generating music card for track:", track.info.title);

            // Music card creation
            const musicard = await Dynamic({
                thumbnailImage: track.info.thumbnail || 'https://example.com/default_thumbnail.png',
                backgroundColor: '#121212',
                progress: 10,
                progressColor: '#ffcc00',
                progressBarColor: '#dbd8d3',
                name: track.info.title,
                nameColor: '#dbd8d3',
                author: track.info.author || 'Unknown Artist',
                authorColor: '#a1a1a1',
            });

            console.log("Music card generated successfully");

            const cardPath = path.join(__dirname, 'musicard.png');
            fs.writeFileSync(cardPath, musicard);

            const attachment = new AttachmentBuilder(cardPath, { name: 'musicard.png' });

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'Now Playing',
                    iconURL: 'https://cdn.discordapp.com/emojis/838704777436200981.gif'
                })
                .setImage('https://cdn.discordapp.com/attachments/1284095258044534859/1320461296562475008/player_banner.png?ex=6769aeea&is=67685d6a&hm=f4664ad2100dea741b2f5b73f5238acc1d997492e1da8939c18da6c4dd2fbebb&')
                .setColor('#dbd8d3')
                .setDescription('')
                .setFooter({
                    text: `Requested by ${requester.username}`,
                    iconURL: requester.avatarURL || 'https://example.com/default_avatar.png',
                });

            const actionRow1 = createActionRow1(false);
            const actionRow2 = createActionRow2(false);

            const message = await channel.send({
                embeds: [embed],
                files: [attachment],
                components: [actionRow1, actionRow2]
            });
            currentTrackMessageId = message.id;

            if (collector) collector.stop();
            collector = setupCollector(client, player, channel, message);

        } catch (error) {
            console.error("Error creating or sending music card:", error.message);

            // Send an error embed to the channel
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription("⚠️ **Unable to load track card. Continuing playback...**");
            await channel.send({ embeds: [errorEmbed] });
        }
    });

    client.riffy.on("trackEnd", async (player) => {
        await disableTrackMessage(client, player);
        currentTrackMessageId = null;
    });

    client.riffy.on("playerDisconnect", async (player) => {
        await disableTrackMessage(client, player);
        currentTrackMessageId = null;
    });

    client.riffy.on("queueEnd", async (player) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (channel && currentTrackMessageId) {
            const queueEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription('**Queue Songs ended! Disconnecting Bot!**');
            await channel.send({ embeds: [queueEmbed] });
        }
        player.destroy();
        currentTrackMessageId = null;
    });

    async function disableTrackMessage(client, player) {
        const channel = client.channels.cache.get(player.textChannel);
        if (!channel || !currentTrackMessageId) return;

        try {
            const message = await channel.messages.fetch(currentTrackMessageId);
            if (message) {
                const disabledRow1 = createActionRow1(true);
                const disabledRow2 = createActionRow2(true);
                await message.edit({ components: [disabledRow1, disabledRow2] });
            }
        } catch (error) {
            console.error("Failed to disable message components:", error);
        }
    }
}

function setupCollector(client, player, channel, message) {
    const filter = i => [
        'loopToggle', 'skipTrack', 'disableLoop', 'showQueue', 'clearQueue',
        'stopTrack', 'pauseTrack', 'resumeTrack', 'volumeUp', 'volumeDown'
    ].includes(i.customId);

    const collector = message.createMessageComponentCollector({ filter, time: 600000 });

    collector.on('collect', async i => {
        await i.deferUpdate();

        const member = i.member;
        const voiceChannel = member.voice.channel;
        const playerChannel = player.voiceChannel;

        if (!voiceChannel || voiceChannel.id !== playerChannel) {
            const vcEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription('🔒 **You need to be in the same voice channel to use the controls!**');
            const sentMessage = await channel.send({ embeds: [vcEmbed] });
            setTimeout(() => sentMessage.delete(), 5000); // Delete after 5 seconds
        }

        // Add your other logic for interaction handling here...

    });

    return collector;
}

function createActionRow1(disabled) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('skipTrack')
            .setLabel('Skip')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('loopToggle')
            .setLabel('Loop')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled)
    );
}

function createActionRow2(disabled) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('stopTrack')
            .setLabel('Stop')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled)
    );
}

module.exports = { initializePlayer };
