const Song = require("./song");


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

        const audioURLs = await Song.getStreamURL(next.url);
        return audioURLs;
    }

    return playlist;
}
