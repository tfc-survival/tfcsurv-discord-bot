import { stat } from 'fs/promises';
import {
    ChannelType,
    CommandInteraction, GuildMember,
    PermissionsBitField,
    SlashCommandBuilder,
    VoiceBasedChannel,
} from 'discord.js';
import {
    AudioResource,
    createAudioResource, getVoiceConnection,
    joinVoiceChannel,
    NoSubscriberBehavior, VoiceConnection
} from "@discordjs/voice";
import ytdl from 'discord-ytdl-core';
import {getOrCreatePlayer} from "../playerSync";
import {DEFAULT_RESOURCE_LOCATION} from "../config";

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDescription('connects to your voice channel and plays audio file')
        .addStringOption((option) =>
            option
                .setName('resource')
                .setDescription('Resource to play')
                .setRequired(true)
        )
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('Voice channel to connect')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(false)
        )
        .addNumberOption((option) =>
            option
                .setName('duration')
                .setDescription('duration of connect')
                .setRequired(false)
        ),
    async execute(interaction: CommandInteraction) {
        const issuer = interaction.user;

        if (issuer.bot) {
            return;
        }

        const guildId = interaction.guildId;
        const guild = interaction.guild;
        const member: GuildMember | null = interaction.member as GuildMember;

        if (!guildId || !member || !guild) {
            await interaction.reply({content: 'Cannot find guild', ephemeral: true});
            return;
        }

        const voiceChannelArg = interaction.options.get('channel');
        let voiceChannel: VoiceBasedChannel | null = null;

        if (voiceChannelArg) {
            voiceChannel = interaction.guild?.channels.cache.get(
                voiceChannelArg.value as string
            ) as VoiceBasedChannel;
        } else {
            voiceChannel = member.voice.channel;
        }

        if (!voiceChannel) {
            await interaction.reply({content: 'Cannot find voice channel', ephemeral: true});
            return;
        }

        const durationArg = interaction.options.get('duration');
        let duration: number | undefined;

        if (durationArg) {
            duration = Number(durationArg.value);
        }

        const resourceArg = interaction.options.get('resource');
        const source = resourceArg?.value as string;

        if (!source) {
            await interaction.reply({content: 'Resource arg is required', ephemeral: true});
            return;
        }

        const audioPlayer = getOrCreatePlayer(guildId, {
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });

        let isYoutubeResource = false;
        let resource: AudioResource<null> | any | null = null;

        try {
            const isLink = source.startsWith('http');
            const isMP3File = source.includes('.mp3');
            isYoutubeResource = isLink && source.includes('youtube.com');

            console.log('Source', source);
            console.log('Is link:', isLink, '; Is mp3:', isMP3File, '; Is youtube:', isYoutubeResource);

            if (isLink) {
                if (isYoutubeResource) {
                    resource = createAudioResource(await ytdl(source, {
                        filter: 'audioonly',
                        opusEncoded: true,
                        encoderArgs: ['-af', 'bass=g=10,dynaudnorm=f=200']
                    }));
                } else if (isMP3File) {
                    resource = createAudioResource(source);
                }
            } else {
                const fileURI = `${DEFAULT_RESOURCE_LOCATION}/${source}.mp3`;
                console.log('File path', fileURI);
                await stat(fileURI);
                resource = createAudioResource(fileURI);
            }

            if (!resource) {
                throw new Error();
            }
        } catch (err) {
            console.error(err);
            await interaction.reply({content: 'Resource not found', ephemeral: true});
            return;
        }

        try {
            if (!audioPlayer) {
                throw new Error('Cannot init player');
            }

            let connection: VoiceConnection | undefined = await getVoiceConnection(guildId);

            if (!connection) {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: false,
                });
            }

            audioPlayer.play(resource);

            const subscription = connection.subscribe(audioPlayer);

            // subscription could be undefined if the connection is destroyed!
            if (subscription && duration) {
                // Unsubscribe after N seconds (stop playing audio on the voice connection)
                setTimeout(() => {
                    audioPlayer.stop(true);
                    subscription.unsubscribe();
                }, duration);
            }
        } catch (err) {
            console.error(err);
            await interaction.reply({content: 'Cannot connect to voice channel', ephemeral: true});
            return;
        }

        await interaction.reply({content: 'Connected', ephemeral: true});
    },
    disabled: false,
};
