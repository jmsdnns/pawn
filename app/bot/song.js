const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const axios = require("axios");

const bandcamp = require("../streams/bandcamp");
const soundcloud = require("../streams/soundcloud");
const youtube = require("../streams/youtube");

const DATA_DIR = path.join(__dirname, "..", "data");
const CACHE_DIR = path.join(DATA_DIR, "audiofiles");


exports.getStreamURL = async (songSrc) => {
    // Bandcamp
    if (songSrc.indexOf('bandcamp.com') > 0) {
        const { streams } = await bandcamp.parseSourcePage(songSrc);

        const stream = streams[0];
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
        return {
            source: songSrc,
            url: stream.url
        }
    }
    // Raw file
    else {
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

    song.filepath = () => {
        return path.resolve(CACHE_DIR, song.cacheName);
    }

    song.streampath = () => {
        if (song.cached) {
            return song.filepath();
        }
        else {
            return this.getStreamURL(song.url);
        }
    };

    song.download = async () => {
        const filepath = song.filepath();
        const writer = fs.createWriteStream(filepath);
        const done = new Promise(fulfill => writer.on("finish", fulfill));

        const { url } = await this.getStreamURL(song.url);
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream'
        });
        response.data.pipe(writer);

        return { response, done };
    };

    return song;
};
