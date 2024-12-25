const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  name: "info",
  description: "Displays bot and developer information.",
  permissions: "0x0000000000000800",
  options: [],
  run: async (client, interaction) => {
    try {
      const botName = client.user.username;
      const botAvatar = client.user.displayAvatarURL();

      // Function for current date and time
      const getTime = () => {
        const now = new Date();
        return `Today at ${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
      };

      // Info about the bot and developer
      const botInfo = `**Musixo** is a music bot for Discord. It supports platforms like YouTube, Spotify, and SoundCloud. It offers playback features, playlists, and more. However, due to limited resources, we currently do not support the 24/7 feature.`;
      const botBanner = "https://cdn.discordapp.com/attachments/1285468038610686003/1321427850779295834/Musixo_Website_Banner.png?ex=676d3316&is=676be196&hm=5a816fd79764b86892d3b882e57d499c60b9ac4dbc4620ffc1ef315e77c4357d&";
      const developerInfo = `**The bot is created and developed by [Rishi](https://guns.lol/rishizip).**`;
      const developerBanner = "https://cdn.discordapp.com/attachments/1284095258044534859/1318901408954585191/MUSIXO_-_DEV_Banner.png";

      // Dropdown Menu
      const dropdown = new StringSelectMenuBuilder()
        .setCustomId('info-menu')
        .setPlaceholder('Choose a category')
        .addOptions([
          {
            label: 'About Bot',
            description: 'Learn more about Musixo.',
            value: 'about_bot',
            emoji: '<:muxiov2modified:1317762589647699969>',
          },
          {
            label: 'About Developer',
            description: 'Information about the developer.',
            value: 'about_developer',
            emoji: '<:developerlogo:1317761650014683166>',
          },
          {
            label: 'Back to Main Menu',
            description: 'Return to the main menu.',
            value: 'main_menu',
            emoji: '<:backlogo:1317775401254260746>',
          },
        ]);

      const row = new ActionRowBuilder().addComponents(dropdown);

      // Initial Embed
      const mainEmbed = new EmbedBuilder()
        .setColor('#dbd8d3') // Updated embed color
        .setAuthor({ 
          name: 'About Me',
          iconURL: 'https://cdn.discordapp.com/attachments/1284095258044534859/1317864810549084190/bot_logo.png'
        })
        .setThumbnail(botAvatar)
        .setImage(botBanner) // Updated bot banner image
        .setDescription('<:menulogo:1317057173330858034> Choose a category from the dropdown menu below to get more information about the bot.')
        .setFooter({ text: getTime() });

      // Acknowledge the interaction and send the initial reply
      await interaction.reply({
        embeds: [mainEmbed],
        components: [row],
        ephemeral: false,
      });

      // Collector for interactions
      const filter = (i) => i.customId === 'info-menu' && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 120000 });

      collector.on('collect', async (i) => {
        let categoryEmbed;

        if (i.values[0] === 'about_bot') {
          categoryEmbed = new EmbedBuilder()
            .setColor('#dbd8d3') // Updated embed color
            .setAuthor({ 
              name: 'Bot Info', 
              iconURL: 'https://cdn.discordapp.com/attachments/1284095258044534859/1317791029075640360/info_logo.png' 
            })
            .setDescription(botInfo)
            .setThumbnail(botAvatar)
            .setImage(botBanner) // Updated bot banner image for "Bot Info"
            .setFooter({ text: getTime() });
        } else if (i.values[0] === 'about_developer') {
          categoryEmbed = new EmbedBuilder()
            .setColor('#dbd8d3') // Updated embed color
            .setAuthor({ 
              name: 'Developer Info', 
              iconURL: 'https://cdn.discordapp.com/attachments/1284095258044534859/1317863169443500202/developer_logo.png' 
            })
            .setDescription(developerInfo)
            .setThumbnail(botAvatar)
            .setImage(developerBanner) // Added developer banner image
            .setFooter({ text: getTime() });
        } else if (i.values[0] === 'main_menu') {
          categoryEmbed = mainEmbed;
        }

        await i.update({ embeds: [categoryEmbed], components: [row] });
      });

      collector.on('end', async () => {
        try {
          const disabledDropdown = StringSelectMenuBuilder.from(dropdown).setDisabled(true); // Clone and disable
          const disabledRow = new ActionRowBuilder().addComponents(disabledDropdown);
          await interaction.editReply({ components: [disabledRow] });
        } catch (error) {
          console.error('Error ending interaction:', error);
        }
      });

    } catch (error) {
      console.error('Error in /info command:', error);
    }
  },
};
