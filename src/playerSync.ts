import {AudioPlayer, createAudioPlayer, CreateAudioPlayerOptions} from "@discordjs/voice";

export const GuildPlayerSyncMap = new Map<string, AudioPlayer>();

export const getOrCreatePlayer = (guildId: string, options?: CreateAudioPlayerOptions): AudioPlayer => {
    const player = GuildPlayerSyncMap.get(guildId);

    if (!player) {
        const newPlayer = createAudioPlayer(options);

        GuildPlayerSyncMap.set(guildId, newPlayer);

        return newPlayer;
    }

    return player;
}
