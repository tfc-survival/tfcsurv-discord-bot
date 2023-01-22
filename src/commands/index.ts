import fs from 'node:fs';
import path from 'node:path';
import { Collection } from 'discord.js';
import { MyClient } from '../client';

const initCommands = async (client: MyClient) => {
  client.commands = new Collection();

  const commandsPath = path.join(__dirname);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file !== path.basename(__filename) && file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const { default: command } = await import(filePath);

    if (command?.disabled) {
      continue;
    }

    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if (command?.data && command?.execute) {
      client.commands.set(command.data.name, command);

      console.log(`[INIT] Loaded command /${command.data.name}`);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
};

export default initCommands;
