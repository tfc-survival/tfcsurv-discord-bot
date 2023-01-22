import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  PermissionsBitField,
} from 'discord.js';
import { TOKEN, botIntents } from './config';

export type MyClient = Client & {
  commands?: Collection<string, any>;
};

const client: MyClient = new Client({
  intents: botIntents,
});

export const initClient = async () => {
  const { default: initCommands } = await import('./commands');

  await initCommands(client);

  client.on(Events.ClientReady, () => {
    console.log(`[ON: ClientReady] Logged in as ${client.user?.tag}!`);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    console.log(
      '[ON: InteractionCreate] Received interaction:',
      interaction.commandName,
      ' from ',
      interaction.user.tag
    );

    const command = (interaction.client as MyClient).commands?.get(
      interaction.commandName
    );

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  });

  console.log('[INIT] Logging in...');

  await client.login(TOKEN);
};

export default client;
