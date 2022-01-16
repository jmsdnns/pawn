const ytdl = require("ytdl-core");


const parseStreamData = (streamData) => {
    return {
        source: 'youtube',
        url: streamData.url,
        format: 'file',
        type: streamData.mimeType,
        duration: streamData.approxDurationMs
    }
}


exports.parseSourcePage = async (audioUrl) => {

    const videoID = ytdl.getURLVideoID(audioUrl);

    return await ytdl.getInfo(videoID)
    .then((info) => {
        let audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

        let bestAudio = ytdl.chooseFormat(audioFormats, 'highestaudio');
        const stream = parseStreamData(bestAudio);

        // This would find highest bitrate, but opus seems to be unreliable
        // bestFound = { audioBitrate: 0 };
        //
        // for(let i=0; i<audioFormats.length; i++) {
        //     let current = audioFormats[i];
        //     if(current.audioBitrate > bestFound.audioBitrate) {
        //         bestFound = current;
        //     }
        // }
        //
        //const stream = parseStreamData(bestFound);

        return {
            streams: [stream]
        };
    });
}

