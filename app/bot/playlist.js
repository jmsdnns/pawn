const bandcamp = require("../streams/bandcamp");
const soundcloud = require("../streams/soundcloud");
const youtube = require("../streams/youtube");


exports.makePlaylist = (songs) => {
    const playlist = {};

    playlist.songs = [];
    playlist.position = 0;

    // Bootstrap playlist with given songs
    songs.forEach((song) => {
        playlist.songs.push(song);
    });
    console.log(playlist.songs);


    // METHODS

    playlist.add = (srcURL) => {
        playlist.songs.push(srcURL);
        console.log("TOTAL SONGS: " + playlist.songs.length);
        return playlist.songs.length;
    }

    playlist.next = () => {
        return playlist.songs[playlist.position];
    }

    playlist.setNext = async () => {
        const next = playlist.next();
        console.log("NEXT SONG: " + next);

        playlist.position++;
        if (playlist.position >= playlist.songs.length) {
            playlist.position = 0;
        }

        // Bandcamp
        if (next.indexOf('bandcamp.com') > 0) {
            const { streams } = await bandcamp.parseSourcePage(next);

            const stream = streams[0];
            console.log("BANDCAMP");
            console.log(stream.url);
            return {
                source: next,
                uri: stream.url
            }
        }
        // Soundcloud
        else if (next.indexOf('soundcloud.com') > 0) {
            const { streams } = await soundcloud.parseSourcePage(next);

            for (let i=0; i < streams.length; i++) {
                const stream = streams[i];
                if (stream.format == 'progressive') {
                    console.log("SOUNDCLOUD");
                    console.log(stream.url);
                    return {
                        source: next,
                        uri: stream.url
                    }
                }
            }
        }
        // Youtube
        else if (next.indexOf('youtube.com') > 0) {
            const { streams } = await youtube.parseSourcePage(next);

            const stream = streams[0];
            console.log("YOUTUBE");
            console.log(stream.url);
            return {
                source: next,
                uri: stream.url
            }
        }
        // Raw file
        else {
            console.log("RAW FILE");
            return {
                source: next,
                uri: stream.url
            }
        }
    }

    return playlist;
}
