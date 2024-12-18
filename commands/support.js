const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "support",
  description: "Get support server link and resources",
  permissions: "0x0000000000000800",
  options: [],
  run: async (client, interaction) => {
    try {
      const supportServerLink = "https://dsc.gg/zipify";
      const githubLink = "https://github.com/rishizip";
      const gunslolLink = "https://guns.lol/rishizip";
      const youtubeLink = "https://www.youtube.com/@rishizip";

      const embed = new EmbedBuilder()
        .setColor('#dbd8d3')
        .setAuthor({
          name: "Support Menu",
          iconURL: "https://cdn.discordapp.com/attachments/1284914027289641143/1318913893677924352/support_logo.png?ex=67640dc8&is=6762bc48&hm=9f161c8f9ab7f2a20b542d1ec3fbc480575ddefd9d876611e2b203eb1e04f9a4&",
        })
        .setDescription(
          `**<:links:1316812623685226518> Helpful Links :**\n` +
          `<:discord:1317043530933211166> - [Support Server](${supportServerLink})\n` +
          `<:github:1318917991131385887> - [GitHub](${githubLink})\n` +
          `<:gunslol:1318913278826516532> - [Guns LOL](${gunslolLink})\n` +
          `<:Youtube:1317004967550255215> - [YouTube](${youtubeLink})`
        )
        .setImage(
          'https://cdn.discordapp.com/attachments/1284095258044534859/1318915138065268798/musixo_banner_v2.png?ex=67640ef1&is=6762bd71&hm=4dd7d7b079a0e32d3bea3afe9b824f7308dabe7d25c931d3dfe080f6264b0eeb&'
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      return interaction.reply({
        content: "An error occurred while displaying the support menu.",
        ephemeral: true,
      });
    }
  },
};
