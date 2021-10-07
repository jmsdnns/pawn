const axios = require("axios");
const cheerio = require('cheerio');


const checkForStreams = (item) => {
    if (typeof item.attribs['data-tralbum'] !== "undefined") {
        const albumJSON = item.attribs['data-tralbum'];
        try {
            const album = JSON.parse(albumJSON);
            return album.trackinfo[0];
        }
        catch(err) {}
    }
}


const parseStreamsData = (streamsData) => {
    const streams = [];
    Object.keys(streamsData.file).forEach((format) => {
        const stream = {
            source: 'bandcamp',
            url: streamsData.file[format],
            format: 'file',
            type: 'audio/mpeg',
            duration: streamsData.duration * 1000  // milliseconds
        }
        streams.push(stream);
    });

    return streams;
}


exports.parseSourcePage = async (audio_url) => {
    return await axios.get(audio_url)
    .then((httpResponse) => {
        // Parse source URL
        const songPage = httpResponse.data.replace(/\n/g, ' ');
        const $ = cheerio.load(songPage);

        let streamsData;
        $('html head script').each((idx, item) => {
            const foundStreams = checkForStreams(item);
            if (typeof foundStreams !== "undefined") {
                streamsData = foundStreams;
            }
        });

        const streams = parseStreamsData(streamsData);

        return {
            streams: streams
        };
    })
    .catch((err) => {
        console.log("ERROR: " + audio_url);
        console.log(err);
    });
}


// const AUDIO_URL = "https://americanfood.bandcamp.com/album/wanna-be-a-cat"
// console.log("AUDIO URL: " + AUDIO_URL);

// parseSourcePage(AUDIO_URL).then((result) => {
//     console.log("URLS: " + result.streams.length);
//     console.log(result.streams[0]);
// });
