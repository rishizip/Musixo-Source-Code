const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config.js");
const fs = require("fs");
const path = require('path');
const { printWatermark } = require('./util/pw');
const { initializePlayer } = require('./player');

const client = new Client({
    intents: Object.keys(GatewayIntentBits).map((a) => {
        return GatewayIntentBits[a];
    }),
});

client.config = config;
initializePlayer(client);

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.riffy.init(client.user.id);
});

client.config = config;

fs.readdir("./events", (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0]; 
    client.on(eventName, event.bind(null, client));
    delete require.cache[require.resolve(`./events/${file}`)];
  });
});

client.commands = [];

// Enhanced Command Loading Logic
fs.readdir(config.commandsDir, (err, files) => {
  if (err) {
    console.error(`Error reading commands directory: ${err.message}`);
    throw err;
  }

  files.forEach((f) => {
    if (f.endsWith(".js")) {
      try {
        // Attempt to load the command file
        let props = require(`${config.commandsDir}/${f}`);

        // Validate required properties
        if (!props.name || !props.run) {
          throw new Error(`Command file ${f} is missing "name" or "run" property.`);
        }

        // Push valid commands to client.commands
        client.commands.push({
          name: props.name,
          description: props.description || "No description provided.",
          options: props.options || [],
        });

        console.log(`✔ Loaded command: ${props.name}`);
      } catch (err) {
        console.error(`❌ Failed to load command ${f}: ${err.message}`);
      }
    }
  });
});

client.on("raw", (d) => {
    const { GatewayDispatchEvents } = require("discord.js");
    if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
    client.riffy.updateVoiceState(d);
});

client.login(config.TOKEN || process.env.TOKEN).catch((e) => {
    console.log('TOKEN ERROR❌  - Turn On Intents or Reset New Token');
});

const express = require("express");
const app = express();
const port = 3000;
app.get('/', (req, res) => {
    const imagePath = path.join(__dirname, 'index.html');
    res.sendFile(imagePath);
});
app.listen(port, () => {
    console.log(`📂 Listening to rishizip : http://localhost:${port}`);
});

printWatermark();
