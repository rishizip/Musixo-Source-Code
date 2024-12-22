const { Riffy } = require("riffy");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const { queueNames, requesters } = require("./commands/play");
const { Dynamic } = require("musicard");
const config = require("./config.js");
const fs = require("fs");
const path = require("path");

function initializePlayer(client) {
    const nodes = config.nodes.map(node => ({
        name: node.name,
        host: node.host,
        port: node.port,
        password: node.password,
        secure: node.secure,
        reconnectTimeout: 5000,
        reconnectTries: Infinity
    }));

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

    let currentTrackMessageId = null;
    let collector = null;

    client.riffy.on("nodeConnect", node => {
        console.log(`Node "${node.name}" connected.`);
    });

    client.riffy.on("nodeError", (node, error) => {
        console.error(`Node "${node.name}" encountered an error: ${error.message}.`);
    });

    client.riffy.on("trackStart", async (player, track) => {
        const channel = client.channels.cache.get(player.textChannel);
        const trackUri = track.info.uri;
        const requester = requesters.get(trackUri);

        try {
            // Music card creation
            const musicard = await Dynamic({
                thumbnailImage: track.info.thumbnail || 'https://example.com/default_thumbnail.png',
                backgroundColor: '#121212',  // Keep a consistent background color
                progress: 10,
                progressColor: '#ffcc00',  // Consistent progress color
                progressBarColor: '#dbd8d3', // Bot color for progress bar
                name: track.info.title,
                nameColor: '#dbd8d3', // Bot color for track name
                author: track.info.author || 'Unknown Artist',
                authorColor: '#a1a1a1', // Consistent author color
            });

            const cardPath = path.join(__dirname, 'musicard.png');
            fs.writeFileSync(cardPath, musicard);

            const attachment = new AttachmentBuilder(cardPath, { name: 'musicard.png' });

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'Now Playing',
                    iconURL: 'https://cdn.discordapp.com/emojis/838704777436200981.gif'
                })
                .setImage('https://cdn.discordapp.com/attachments/1284914027289641143/1320448552635207701/player_banner.png?ex=6769a30b&is=6768518b&hm=3053db47b480fac7d3cab0ff2b8744bb2af236d772ee29fddd1cae21d6f5a32d')
                .setColor('#dbd8d3') // Consistent bot color for embed
                .setDescription('') // No description, just the image
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
            setTimeout(() => sentMessage.delete().catch(console.error), config.embedTimeout * 1000);
            return;
        }

        handleInteraction(i, player, channel);
    });

    collector.on('end', () => {
        console.log("Collector stopped.");
    });

    return collector;
}

async function handleInteraction(i, player, channel) {
    switch (i.customId) {
        case 'loopToggle':
            toggleLoop(player, channel);
            break;
        case 'skipTrack':
            player.stop();
            await sendEmbed(channel, "⏭️ **Player will play the next song!**");
            break;
        case 'disableLoop':
            disableLoop(player, channel);
            break;
        case 'showQueue':
            showQueue(channel);
            break;
        case 'clearQueue':
            player.queue.clear();
            await sendEmbed(channel, "🗑️ **Queue has been cleared!**");
            break;
        case 'stopTrack':
            player.stop();
            player.destroy();
            await sendEmbed(channel, '⏹️ **Playback has been stopped and player destroyed!**');
            break;
        case 'pauseTrack':
            if (player.paused) {
                await sendEmbed(channel, '⏸️ **Playback is already paused!**');
            } else {
                player.pause(true);
                await sendEmbed(channel, '⏸️ **Playback has been paused!**');
            }
            break;
        case 'resumeTrack':
            if (!player.paused) {
                await sendEmbed(channel, '▶️ **Playback is already resumed!**');
            } else {
                player.pause(false);
                await sendEmbed(channel, '▶️ **Playback has been resumed!**');
            }
            break;
        case 'volumeUp':
            adjustVolume(player, channel, 10);
            break;
        case 'volumeDown':
            adjustVolume(player, channel, -10);
            break;
    }
}

async function sendEmbed(channel, message) {
    const embed = new EmbedBuilder().setColor(config.embedColor).setDescription(message);
    const sentMessage = await channel.send({ embeds: [embed] });
    setTimeout(() => sentMessage.delete().catch(console.error), config.embedTimeout * 1000);
}

function adjustVolume(player, channel, amount) {
    const newVolume = Math.min(100, Math.max(10, player.volume + amount));
    if (newVolume === player.volume) {
        sendEmbed(channel, amount > 0 ? '🔊 **Volume is already at maximum!**' : '🔉 **Volume is already at minimum!**');
    } else {
        player.setVolume(newVolume);
        sendEmbed(channel, `🔊 **Volume changed to ${newVolume}%!**`);
    }
}

function toggleLoop(player, channel) {
    player.setLoop(player.loop === "track" ? "queue" : "track");
    sendEmbed(channel, player.loop === "track" ? "🔁 **Track loop is activated!**" : "🔁 **Queue loop is activated!**");
}

function disableLoop(player, channel) {
    player.setLoop("none");
    sendEmbed(channel, "❌ **Loop is disabled!**");
}

function showQueue(channel) {
    if (queueNames.length === 0) {
        sendEmbed(channel, "The queue is empty.");
        return;
    }

    const nowPlaying = `🎵 **Now Playing:**\n${formatTrack(queueNames[0])}`;
    const queueChunks = [];

    for (let i = 1; i < queueNames.length; i += 10) {
        const chunk = queueNames.slice(i, i + 10).map(formatTrack).join("\n");
        queueChunks.push(chunk);
    }

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle("Queue:")
        .setDescription(nowPlaying + "\n" + queueChunks.join("\n"))
        .setFooter({ text: `Requested by ${requesters.get(queueNames[0].uri)?.username}` });

    channel.send({ embeds: [embed] });
}

function formatTrack(track) {
    return `${track.info.title} by ${track.info.author}`;
}

// Define the action row creation functions
function createActionRow1(disabled) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId("loopToggle").setEmoji('<:synclogo:1320415646370103376>').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("disableLoop").setEmoji('<:disablelogo:1320412997218205696>').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("skipTrack").setEmoji('<:skiplogo:1320414333523591178>').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("showQueue").setEmoji('<:queuelogo:1320413053187002428>').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("clearQueue").setEmoji('<:clearlogo:1320413125626953729>').setStyle(ButtonStyle.Secondary).setDisabled(disabled)
        );
}

function createActionRow2(disabled) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId("stopTrack").setEmoji('<:stoplogo:1320413021876654194>').setStyle(ButtonStyle.Danger).setDisabled(disabled),
            new ButtonBuilder().setCustomId("pauseTrack").setEmoji('<:pauselogo:1320412748575670294>').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("resumeTrack").setEmoji('<:playlogo:1320412974644727880>').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("volumeUp").setEmoji('<:volpluslogo:1320413395727417375>').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("volumeDown").setEmoji('<:volminuslogo:1320413413330915349>').setStyle(ButtonStyle.Secondary).setDisabled(disabled)
        );
}

module.exports = { initializePlayer };
