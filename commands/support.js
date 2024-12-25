const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: "support",
  description: "Access the support server and other resources",
  permissions: "0x0000000000000800",
  options: [],
  run: async (client, interaction) => {
    try {
      const supportServerLink = "https://dsc.gg/zipify";
      const githubLink = "https://github.com/rishizip";
      const gunslolLink = "https://guns.lol/rishizip";
      const youtubeLink = "https://www.youtube.com/@rishizip";
      const websiteLink = "https://rishizip.wixsite.com/musixo";
      const gmailLink = "mailto:musixodc@gmail.com";

      const embed = new EmbedBuilder()
        .setColor('#dbd8d3')
        .setAuthor({
          name: "Support Menu",
          iconURL: "https://cdn.discordapp.com/attachments/1284914027289641143/1318913893677924352/support_logo.png",
        })
        .setDescription(
          "Need help or want to explore more? Use the buttons below to access our support server, resources, and platforms."
        )
        .setImage(
          'https://cdn.discordapp.com/attachments/1285468038610686003/1321427850779295834/Musixo_Website_Banner.png'
        )
        .setTimestamp();

      const row1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel("Support Server")
            .setStyle(ButtonStyle.Link)
            .setURL(supportServerLink)
            .setEmoji('<:discord:1317043530933211166>'),
          new ButtonBuilder()
            .setLabel("GitHub")
            .setStyle(ButtonStyle.Link)
            .setURL(githubLink)
            .setEmoji('<:github:1318917991131385887>')
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel("Guns LOL")
            .setStyle(ButtonStyle.Link)
            .setURL(gunslolLink)
            .setEmoji('<:gunslol:1318913278826516532>'),
          new ButtonBuilder()
            .setLabel("YouTube")
            .setStyle(ButtonStyle.Link)
            .setURL(youtubeLink)
            .setEmoji('<:Youtube:1317004967550255215>')
        );

      const row3 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel("Website")
            .setStyle(ButtonStyle.Link)
            .setURL(websiteLink)
            .setEmoji('<:dashboardlogo:1321181081298534420>'),
          new ButtonBuilder()
            .setLabel("Gmail")
            .setStyle(ButtonStyle.Link)
            .setURL(gmailLink)
            .setEmoji('<:gmaillogo:1321433432269520957>')
        );

      return interaction.reply({ embeds: [embed], components: [row1, row2, row3] });
    } catch (e) {
      console.error(e);
      return interaction.reply({
        content: "An error occurred while displaying the support menu.",
        ephemeral: true,
      });
    }
  },
};
