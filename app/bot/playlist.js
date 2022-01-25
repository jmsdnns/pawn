const Song = require("./song");


exports.makePlaylist = (urls) => {
    const playlist = {};

    playlist.songs = [];
    playlist.position = 0;

    playlist.download = async ({concurrency = 3, callback = (idx, item)=>{}}) => {
        if (playlist.songs.length < concurrency) {
            concurrency = playlist.songs.length;
        }

        console.log("Downloading " + playlist.songs.length + " songs");
    
        async function download(iterator) {
            for (let [idx, item] of iterator) {
                const { done } = await item.download();
                await done;
                callback(idx, item);
            }
        }
    
        const iterator = playlist.songs.entries();
        const workers = new Array(concurrency).fill(iterator).map(download);
        return workers;
    };

    playlist.add = (url) => {
        const song = Song.makeSong(url);
        playlist.songs.push(song);
        console.log("TOTAL SONGS: " + playlist.songs.length);
        song.download();
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

        // const audioURLs = await Song.getStreamURL(next.url);
        // return audioURLs;
        return {
            source: next.url,
            url: next.streampath()
        };
    }

    // Bootstrap playlist with given songs
    urls.forEach((url) => {
        const song = Song.makeSong(url);
        playlist.songs.push(song);
    });

    return playlist;
}
