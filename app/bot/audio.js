const https = require('https');

const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	entersState,
	AudioPlayerStatus,
	VoiceConnectionStatus,
} = require('@discordjs/voice');

const { channelTrackingAdapter } = require('./adapter');
const { makePlaylist } = require("./playlist");


// Audio Server

exports.makePlayer = (config) => {

    const player = {};

    player.audioPlayer = createAudioPlayer();
    player.config = config;

    // Used to prevent Idle events from skipping a song that is loading slowly
    player._loadingSong = false;

    player.setPlaylist = (urls) => {
        player.playlist = makePlaylist(urls);
    };

    player.setClient = (client) => {
        player.client = client;
    };


    // EVENTS

    player.audioPlayer.on(AudioPlayerStatus.Playing, async () => {
        console.log('STATUS is PLAYING');

        player._loadingSong = false;
        const textChannel = await player.getStatusChannel();
        textChannel.send('Now playing: ' + player.currentSong.url);
    });

    player.audioPlayer.on('error', error => {
        console.error('ERROR:', error.message);
    });

    player.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
        console.log("IDLE");
        if(player._loadingSong === false) {
            player.nextSong();
        }
    });


    // JUKEBOX

    player.run = async () => {
        await player.joinRadioChannel();
        player.nextSong();
    }

    player.nextSong = async () => {
        const nextSong = player.playlist.next();
        player.currentSong = nextSong;

        const { source, url } = await player.playlist.setNext();

        try {
            console.log("CUR: " + player.currentSong.url);
            console.log("SRC: " + source);
            
            // This allows users to skip several times, faster than the
            // machinery can keep up with, and the radio will only start
            // a stream matching the actual current song
            if (player.currentSong.url === source) {
                const { resource } = await player.playSong(url);
        
                return {
                    status: 'ok',
                    type: 'nextSong',
                    song: nextSong,
                    resource: resource
                };
            }
            else {
                console.log("STREAM SKIPPED");
                console.log("- source : " + source);
            }
        } catch(error) {
            console.log("ERROR: NEXT SONG FAILED");
            console.error(error);

            return { status: 'error', type: 'nextSong' };
        }
    }

    player.playSong = (url) => {
        console.log("PLAY SONG: " + url);

        // URL path
        if (url && url.startsWith('https')) {
            const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 12.1; rv:96.0) Gecko/20210430 Firefox/96.0";
            const options = { headers: { 'User-Agent': ua } };

            https.get(url, options, (stream) => {
                console.log("GETTING HTTP STREAM");
                // console.log(stream.headers);

                const resource = createAudioResource(stream);
                player.audioPlayer.play(resource);
                player._loadingSong = true;

                return {
                    status: 'ok',
                    resource: resource
                };
            });
        }

        // Local file path
        const resource = createAudioResource(url);
        player.audioPlayer.play(resource);
        entersState(player.audioPlayer, AudioPlayerStatus.Playing, 5e3);

        return {
            status: 'ok',
            resource: resource
        };
    }


    // CHANNELS

    player.getChannel = async (channelID) => {
        return await player.client.channels.fetch(channelID)
            .catch(e => {
                console.log("CHANNEL FETCH ERROR");
                console.error(e);
            });
    }


    player.getVoiceChannel = () => {
        const voiceChannel = player.getChannel(config.voiceChannelID);
        return voiceChannel;
    }


    player.getStatusChannel = () => {
        const textChannel = player.getChannel(config.statusChannelID);
        return textChannel;
    }


    player.connectToVoiceChannel = async (channel) => {
        console.log("CHANNEL ID: " + channel.id);
        console.log("GUILD ID:   " + channel.guild.id);
        
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channelTrackingAdapter(channel)
            // adapterCreator: channel.guild.voiceAdapterCreator
        });

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
            return connection;
        } catch (error) {
            connection.destroy();
            throw error;
        }
    }


    player.joinRadioChannel = async () => {
        const voiceChannel = await player.getVoiceChannel();
        const textChannel = await player.getStatusChannel();

        if (typeof voiceChannel === "undefined") {
            textChannel.send('Voice channel ID did not match any voice channels');
            console.log("ERROR: COULD NOT LOAD CHANNEL ID: " + config.voiceChannelID);
            return { status: 'error', type: 'join' };
        }

        try {
            const connection = await player.connectToVoiceChannel(voiceChannel);
            connection.subscribe(player.audioPlayer);
            textChannel.send('OK! Im in the voice channel now.');
            console.log("JOIN OK");

            return {
                type: 'join',
                status: 'ok',
                channel: voiceChannel,
                connection: connection
            };
        } catch (error) {
            textChannel.send('Something didnt work...');
            console.log("ERROR: JOINING CHANNEL FAILED");
            console.error(error);

            return { status: 'error', type: 'join' };
        }
    };


    // MESSAGES

    player.readMessage = async (message) => {
        if (! message.content || ! message.content.startsWith(config.cmdPrefix)) {
            return;
        }

        // JOIN MESSAGE
        if (message.content === config.cmdPrefix + 'join') {
            console.log("JOIN");
            
            const channel = await player.getVoiceChannel(message.guild.channels, config.voiceChannelID);

            if (typeof channel === "undefined") {
                message.reply('Voice channel ID did not match any voice channels');
                console.log("ERROR: COULD NOT LOAD CHANNEL ID: " + config.voiceChannelID);
                return { status: 'error', type: 'join' };
            }

            try {
                const connection = await player.connectToChannel(channel);
                connection.subscribe(player.audioPlayer);
                message.reply('OK! Im in the voice channel now.');
                console.log("JOIN OK");

                return {
                    type: 'join',
                    status: 'ok',
                    channel: channel,
                    connection: connection
                };
            } catch (error) {
                message.reply('Something didnt work...');
                console.log("ERROR: JOINING CHANNEL FAILED");
                console.error(error);

                return { status: 'error', type: 'join' };
            }
        }

        // PLAY MESSAGE
        if (message.content === config.cmdPrefix + 'play') {
            console.log("PLAY");
            const { status } = await player.nextSong();
            if (status == 'ok') {
                return { status: 'ok', type: 'pause' };
            }
            return { status: 'error', type: 'pause' };
        }

        // PAUSE MESSAGE
        if (message.content === config.cmdPrefix + 'pause') {
            console.log("PAUSE");
            if (player.audioPlayer.pause()) {
                return { status: 'ok', type: 'pause' };
            }
            return { status: 'error', type: 'pause' };
        }

        // UNPAUSE MESSAGE
        if (message.content === config.cmdPrefix + 'unpause') {
            console.log("UNPAUSE");
            if (player.audioPlayer.unpause()) {
                return { status: 'ok', type: 'unpause' };
            }
            return { status: 'error', type: 'unpause' };
        }

        // SKIP MESSAGE
        if (message.content === config.cmdPrefix + 'skip') {
            console.log("SKIP");
            // This method follows: { status: ..., type: ... }
            player.nextSong();
        }

        // ADD MESSAGE
        if (message.content.startsWith(config.cmdPrefix + 'add')) {
            console.log("ADD");
            const payload = message.content.replace(config.cmdPrefix + 'add' + ' ', "").trim();
            player.playlist.add(payload);
            return { status: 'ok', type: 'add' };
        }
    }

    return player;
}
