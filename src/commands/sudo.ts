import {
  ChannelType,
  CommandInteraction,
  PermissionsBitField,
  SlashCommandBuilder,
  TextBasedChannel,
  TextChannel,
} from 'discord.js';
import fetch from 'isomorphic-fetch';

export default {
  data: new SlashCommandBuilder()
    .setName('sudo')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addStringOption((option) =>
      option
        .setName('args')
        .setDescription('arguments to pass to command')
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setDescription('user to impersonate')
        .setName('user')
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('channel to send message')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDescription('super user do'),
  async execute(interaction: CommandInteraction) {
    const issuer = interaction.user;

    if (issuer.bot) {
      return;
    }

    const args = interaction.options.get('args');

    if (!args) {
      await interaction.reply({
        content: 'No arguments provided',
        ephemeral: true,
      });

      return;
    }

    let channel = interaction.channel;

    const argChannel = interaction.options.get('channel');

    if (argChannel) {
      channel = interaction.guild?.channels.cache.get(
        argChannel.value as string
      ) as TextBasedChannel;
    }

    const argUser = interaction.options.get('user');

    if (argUser) {
      // TODO get user from args

      const user = interaction.guild?.members.cache.get(
        argUser.value as string
      );

      if (!user) {
        await interaction.reply({ content: 'User not found', ephemeral: true });

        return;
      }

      const avatarUrl = user?.user.displayAvatarURL();

      const webhook = await (channel as TextChannel)?.createWebhook({
        name: user?.displayName as string,
        avatar: avatarUrl,
      });

      const webhookURL = webhook.url;
      await fetch(webhookURL, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({
          content: args.value as string,
          avatarUrl,
          avatar_url: avatarUrl,
        }),
      });

      await webhook.delete();
    } else {
      await channel?.send({
        content: args.value as string,
      });
    }

    await interaction.reply({ content: 'Done', ephemeral: true });
  },
  disabled: false,
};
