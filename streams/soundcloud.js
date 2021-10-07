const axios = require("axios");
const cheerio = require('cheerio');


const extractClientID = (jsSrc) => {
    const CLIENT_ID_KEY = 'client_id:';

    const clientIDStart = jsSrc.indexOf(CLIENT_ID_KEY);
    // console.log("ID START: " + clientIDStart);
    if (clientIDStart < 0) return;

    const clientIDEnd = jsSrc.indexOf(',', clientIDStart);
    // console.log("ID END  : " + clientIDEnd);
    const startOffset = clientIDStart + CLIENT_ID_KEY.length;

    const foundID = jsSrc.slice(startOffset, clientIDEnd);
    // console.log("FOUND ID: " + foundID);

    // Validate client ID
    try {
        const parsedID = JSON.parse(foundID);
        if(parsedID.length == 32 && parsedID.match(/^[A-Za-z0-9]+$/)) {
            // console.log("VALID ID: " + parsedID);
            return parsedID;
        }
    }
    catch(err) {}
}


const checkForStreams = (item) => {
    if (item.children && item.children.length > 0) {
        const scriptData = item.children[0].data;
        const startIdx = scriptData.indexOf('{"transcodings":');

        if (startIdx > 0) {
            const endIdx = scriptData.indexOf(",\"station_urn", startIdx);

            if (endIdx > startIdx) { 
                const transcodingsJson = scriptData.slice(startIdx, endIdx);
                const transcodings = JSON.parse(transcodingsJson);
                return transcodings.transcodings;
            }
        }
    }
}


const checkRemoteFilesForClientID = async (jsURLs) => {
    // console.log("REMOTE FILES");
    for(let i=0; i < jsURLs.length; i++) {
        const clientID = await axios.get(jsURLs[i])
            .then((httpResponse) => {
                return extractClientID(httpResponse.data);
            })
            .catch((err) => {});

        if (typeof clientID !== "undefined") {
            // console.log("RETURNING ID: " + clientID);
            return clientID;
        }
    }
}


const parseStreamsData = (streamsData, clientID) => {
    // {
    //     url: 'https://...',
    //     preset: 'mp3_0_1',
    //     duration: 177816,
    //     snipped: false,
    //     format: { protocol: 'hls', mime_type: 'audio/mpeg' },
    //     quality: 'sq'
    // }

    const streams = streamsData.map((streamItem) => {
        return {
            source: 'soundcloud',
            url: streamItem.url + '?client_id=' + clientID,
            format: streamItem.format.protocol,
            type: streamItem.format.mime_type,
            duration: streamItem.duration
        }
    });
    
    return streams;
}


exports.parseSourcePage = async (audio_url) => {

    return await axios.get(audio_url)
    .then(async (httpResponse) => {
        // Parse source URL
        const songPage = httpResponse.data.replace(/\n/g, ' ');
        const $ = cheerio.load(songPage);

        // - extract stream URLs
        // - search each external javascript file for client ID

        let streamsData;
        const jsURLs = [];

        $('html script').each((idx, item) => {
            if (typeof item.attribs.src !== "undefined") {
                jsURLs.push(item.attribs.src);
            }

            const foundStreams = checkForStreams(item);
            if (typeof foundStreams !== "undefined") {
                streamsData = foundStreams;
            }
        });

        const clientID = await checkRemoteFilesForClientID(jsURLs);
        const streams = parseStreamsData(streamsData, clientID);

        for (let i=0; i < streams.length; i++) {
            const stream = streams[i];
            if (stream.format == "progressive") {
                const streamURL = await axios.get(stream.url)
                    .then((httpResponse) => {
                        return httpResponse.data.url;
                    })
                    .catch((err) => {});
                stream.url = streamURL;
                return { streams: [stream] };
            }
        }

        return {
            streams: streams
        };
    })
    .catch((err) => {
        console.log("ERROR: " + audio_url);
        console.log(err);
    });
}


// const AUDIO_URL = "https://soundcloud.com/americanfood/never-forget-pt-2"
// console.log("AUDIO URL: " + AUDIO_URL);

// parseSourcePage(AUDIO_URL).then((result) => {
//     console.log("CLIENT ID:   " + result.clientID);
//     console.log("URLS: " + result.streams.length);
//     console.log(result.streams[0]);
//     console.log(result.streams[1]);
//     console.log(result.streams[2]);
// });
