const fs = require("fs");
const path = require("path");

const Song = require("./song");
const bandcamp = require("../streams/bandcamp");
const soundcloud = require("../streams/soundcloud");
const youtube = require("../streams/youtube");


exports.makePlaylist = (urls) => {
    const playlist = {};

    playlist.songs = [];
    playlist.position = 0;


    // Bootstrap playlist with given songs
    urls.forEach((url) => {
        const song = Song.makeSong(url);
        playlist.songs.push(song);
    });


    // METHODS

    playlist.add = (url) => {
        const song = Song.makeSong(url);
        playlist.songs.push(song);
        console.log("TOTAL SONGS: " + playlist.songs.length);
        return playlist.songs.length;
    }

    playlist.next = () => {
        return playlist.songs[playlist.position];
    }

    playlist.setNext = async () => {
        const next = playlist.next();
        console.log("NEXT SONG: " + next.url);

        playlist.position++;
        if (playlist.position >= playlist.songs.length) {
            playlist.position = 0;
        }

        // Bandcamp
        if (next.url.indexOf('bandcamp.com') > 0) {
            const { streams } = await bandcamp.parseSourcePage(next.url);

            const stream = streams[0];
            console.log("BANDCAMP");
            return {
                source: next.url,
                url: stream.url
            }
        }
        // Soundcloud
        else if (next.url.indexOf('soundcloud.com') > 0) {
            const { streams } = await soundcloud.parseSourcePage(next.url);

            for (let i=0; i < streams.length; i++) {
                const stream = streams[i];
                if (stream.format == 'progressive') {
                    console.log("SOUNDCLOUD");
                    return {
                        source: next.url,
                        url: stream.url
                    }
                }
            }
        }
        // Youtube
        else if (next.url.indexOf('youtube.com') > 0) {
            const { streams } = await youtube.parseSourcePage(next.url);

            const stream = streams[0];
            console.log("YOUTUBE");
            return {
                source: next.url,
                url: stream.url
            }
        }
        // Raw file
        else {
            console.log("RAW FILE");
            return {
                source: next.url,
                url: stream.url
            }
        }
    }

    return playlist;
}
