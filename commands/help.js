const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  name: "help",
  description: "Get information about the bot",
  permissions: "0x0000000000000800",
  options: [],
  run: async (client, interaction) => {
    try {
      const botName = client.user.username;

      const musicCommands = `
[ /play    ] - Start playing the songs.
[ /pause   ] - Pause the current song.
[ /resume  ] - Resume the current song.
[ /lyrics  ] - Displays the lyrics of a song.
[ /skip    ] - Skip the current song.
[ /stop    ] - Destroys the music player.
[ /np      ] - Shows now playing song.
[ /volume  ] - Sets the volume of the player.
      `;

      const utilityCommands = `
[ /ping    ] - Check bot latency.
      `;

      const helpCommands = `
[ /support ] - Shows support server info.
[ /help    ] - Display this help menu.
      `;

      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset);
      const formattedTime = `Today at ${istTime.toISOString().slice(11, 16)}`;

      const iconURL = "https://cdn.discordapp.com/attachments/1284914027289641143/1317066060641468426/hand_logo.png?ex=675d54da&is=675c035a&hm=dbec906b0d7b3d8ade83ffe245b2285ac55a0c918c354ae2c116a8973868b583&";

      // Main Embed for Help Menu
      const descriptionEmbed = new EmbedBuilder()
        .setColor('#dbd8d3')
        .setAuthor({
          name: 'Help Menu',
          iconURL: iconURL,
        })
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription("<:menulogo:1317057173330858034> Select a category from the dropdown menu below to view a list of commands.")
        .setFooter({ text: formattedTime });

      // Dropdown Menu
      const dropdown = new StringSelectMenuBuilder()
        .setCustomId('help-menu')
        .setPlaceholder('Choose a category')
        .addOptions([
          {
            label: 'Music',
            description: 'View commands related to music playback.',
            value: 'music',
            emoji: '<:musiclogo:1317048901437620224>',
          },
          {
            label: 'Utility',
            description: 'View utility commands.',
            value: 'utility',
            emoji: '<:utilitylogo:1317048881829384242>',
          },
          {
            label: 'Help',
            description: 'View help and support commands.',
            value: 'help',
            emoji: '<:helplogo:1317048866666975284>',
          },
          {
            label: 'Module',
            description: 'Back to the main help menu.',
            value: 'module',
            emoji: '<:mudulelogo:1317051305193111562>',
          }
        ]);

      const row = new ActionRowBuilder().addComponents(dropdown);

      await interaction.reply({ embeds: [descriptionEmbed], components: [row] });

      const filter = (i) => i.customId === 'help-menu' && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (i) => {
        let categoryEmbed;

        if (i.values[0] === 'music') {
          categoryEmbed = new EmbedBuilder()
            .setColor('#dbd8d3')
            .setAuthor({ name: 'Help Menu', iconURL: iconURL })
            .setThumbnail(client.user.displayAvatarURL())
            .setTitle('Music Commands')
            .setDescription(`\`\`\`css
${musicCommands}\`\`\``)
            .setFooter({ text: formattedTime });
        } else if (i.values[0] === 'utility') {
          categoryEmbed = new EmbedBuilder()
            .setColor('#dbd8d3')
            .setAuthor({ name: 'Help Menu', iconURL: iconURL })
            .setThumbnail(client.user.displayAvatarURL())
            .setTitle('Utility Commands')
            .setDescription(`\`\`\`css
${utilityCommands}\`\`\``)
            .setFooter({ text: formattedTime });
        } else if (i.values[0] === 'help') {
          categoryEmbed = new EmbedBuilder()
            .setColor('#dbd8d3')
            .setAuthor({ name: 'Help Menu', iconURL: iconURL })
            .setThumbnail(client.user.displayAvatarURL())
            .setTitle('Help Commands')
            .setDescription(`\`\`\`css
${helpCommands}\`\`\``)
            .setFooter({ text: formattedTime });
        } else if (i.values[0] === 'module') {
          categoryEmbed = new EmbedBuilder()
            .setColor('#dbd8d3')
            .setAuthor({ name: 'Help Menu', iconURL: iconURL })
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription("<:menulogo:1317057173330858034> Select a category from the dropdown menu below to view a list of commands.")
            .setFooter({ text: formattedTime });
        }

        await i.update({ embeds: [categoryEmbed], components: [row] });
      });

      collector.on('end', () => {
        dropdown.setDisabled(true);
        interaction.editReply({ components: [row] }).catch(console.error);
      });

    } catch (e) {
      console.error(e);
    }
  },
};
