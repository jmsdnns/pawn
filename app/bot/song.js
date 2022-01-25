const crypto = require("crypto");


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
