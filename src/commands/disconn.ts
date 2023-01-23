

import {
    ChannelType,
    CommandInteraction,
    PermissionsBitField,
    SlashCommandBuilder,
} from 'discord.js';
import {getVoiceConnection} from "@discordjs/voice";
import {GuildPlayerSyncMap} from "../playerSync";

export default {
    data: new SlashCommandBuilder()
        .setName('disconn')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDescription('disconnects from current voice channel'),
    async execute(interaction: CommandInteraction) {
        const issuer = interaction.user;

        if (issuer.bot) {
            return;
        }

        const guildId = interaction.guildId;

        if (!guildId) {
            return;
        }

        const guildVoiceConnection = await getVoiceConnection(guildId);

        const player = GuildPlayerSyncMap.get(guildId);
        player?.stop(true);

        if (guildVoiceConnection) {
            guildVoiceConnection.destroy();
        }

        await interaction.reply({ content: 'Diconnected', ephemeral: true });
    },
    disabled: false,
};
