import { REST, Routes } from 'discord.js';
import { TOKEN, CLIENT_ID } from './config';
import client, { initClient } from './client';

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('[INIT] Initializing client...');

    await initClient();

    const commands = client.commands?.map((command) => command.data.toJSON());

    console.log('[INIT] Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

    console.log('[INIT] Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
