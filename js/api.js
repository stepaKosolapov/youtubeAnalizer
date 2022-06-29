API_PATH = "https://youtube.googleapis.com/youtube/v3";

let getChannelIdByURL = async (url) => {
    return fetch('https://cors-anywhere.herokuapp.com/' + url)
    .then(response => response.text())
    .then((html) => {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, "text/html");
        for (let meta of doc.getElementsByTagName('meta')) {
            if (meta.getAttribute('itemprop') === 'channelId') return meta.getAttribute('content');
        }
    })
}

let fetchVideosIds = async (channelId, fromDate, toDate, apiKey) => {
    let nextPageToken;
    let videosIds = [];
    let isFirstLoad = true;
    while (nextPageToken || isFirstLoad) {
        if (isFirstLoad) {
            isFirstLoad = false;
        }

        let path = `${API_PATH}/activities?`
        + `part=contentDetails`
        + `&channelId=${channelId}`
        + `&maxResults=1000`
        + `&publishedAfter=${fromDate.toISOString()}`
        + `&publishedBefore=${toDate.toISOString()}`
        + `&key=${apiKey}`;

        if (nextPageToken) {
            path += `&pageToken=${nextPageToken}`;
        }

        let response = await fetch(path);

        if (response.ok) {
            let data = await response.json();

            nextPageToken = data.nextPageToken;

            for (let el of data.items) {
                if (el.contentDetails.upload) {
                    videosIds.push(el.contentDetails.upload.videoId);
                }
            }
        } else {
            console.log("Error! Request status: ", response.status);
        }
    }
    return videosIds;
}

let fetchVideosInfo = async (videosIds, apiKey) => {
    let promises = [];
    let requestSize = 10;
    for (let i = 0; i < videosIds.length; i += requestSize) {
        let endOfPortion = ((i + requestSize) > videosIds.length) ? videosIds.length : (i + requestSize);
        promises.push(fetch(`${API_PATH}/videos?part=statistics&id=${videosIds.slice(i, endOfPortion).join(",")}&key=${apiKey}`));
    }

    let videosInfo = [];

    await Promise.all(promises)
        .then(async (responseList) => {
            for (let response of responseList) {
                if (response.ok) {
                    let data = await response.json();
                    for (let video of data.items) {
                        videosInfo.push(video.statistics);
                    }
                } else {
                    console.log("Error! Request status: ", response.status);
                }
            }
        })
    return videosInfo;
}