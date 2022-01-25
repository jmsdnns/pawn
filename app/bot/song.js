const crypto = require("crypto");

const bandcamp = require("../streams/bandcamp");
const soundcloud = require("../streams/soundcloud");
const youtube = require("../streams/youtube");


exports.getStreamURL = async (songSrc) => {
    // Bandcamp
    if (songSrc.indexOf('bandcamp.com') > 0) {
        const { streams } = await bandcamp.parseSourcePage(songSrc);

        const stream = streams[0];
        console.log("BANDCAMP");
        return {
            source: songSrc,
            url: stream.url
        }
    }
    // Soundcloud
    else if (songSrc.indexOf('soundcloud.com') > 0) {
        const { streams } = await soundcloud.parseSourcePage(songSrc);

        for (let i=0; i < streams.length; i++) {
            const stream = streams[i];
            if (stream.format == 'progressive') {
                console.log("SOUNDCLOUD");
                return {
                    source: songSrc,
                    url: stream.url
                }
            }
        }
    }
    // Youtube
    else if (songSrc.indexOf('youtube.com') > 0) {
        const { streams } = await youtube.parseSourcePage(songSrc);

        const stream = streams[0];
        console.log("YOUTUBE");
        return {
            source: songSrc,
            url: stream.url
        }
    }
    // Raw file
    else {
        console.log("RAW FILE");
        return {
            source: songSrc,
            url: songSrc
        }
    }
};


exports.makeSong = (url) => {
    const now = new Date();

    const cacheName = crypto.createHash('md5').update(url).digest('hex');

    const song = {
        url: url,
        added: now,
        lastPlay: null,
        cacheName: cacheName,
        cached: false,
    };

    return song;
};
