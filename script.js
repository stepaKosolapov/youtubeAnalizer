let API_PATH = 'https://youtube.googleapis.com/youtube/v3'

for (let el of document.querySelectorAll(".cell")) {
    el.addEventListener('click', () => {
        let currentText = el.textContent.trim();
        if (currentText === '') return
        navigator.clipboard.writeText(currentText.replace(/\s/g, ''))
            .then(() => {
                el.textContent = "Copied";
                setTimeout(()=>{el.textContent = currentText}, 1000)
            })
            .catch(err => {
                console.log('Something went wrong', err);
            })
      });
}

let setError = (elementId, message) => {
    if (message) {
        document.getElementById(elementId + 'Error').textContent = message;
        document.getElementById(elementId + 'Error').style.display = "block";
    } else {
        document.getElementById(elementId + 'Error').style.display = "none";
    }
}

let numberToString = (num) => {
    let str = String(num);
    let dotIndex = str.indexOf('.');
    let fractional = '';
    if (dotIndex !== -1) {
        fractional = str.slice(dotIndex);
        str = str.slice(0, dotIndex);
    }
    let i = (str.length % 3) != 0 ? (str.length % 3) : 3;
    let formatted = [str.slice(0, i)];

    for (; i <= str.length-3; i += 3) {
        formatted.push(str.slice(i, i+3));
    }
    return formatted.join(' ') + fractional;
}

let getDaysBetween = (from, to) => {
    return (new Date(to) - new Date(from))/86400000;
}

let fetchVideosIds = async ({channelId, fromDate, toDate, apiKey}) => {
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

let getChannelIdByURL = async (url) => {
    return fetch('https://cors-anywhere.herokuapp.com/https://www.youtube.com/c/kuplinovplay')
    .then(response => response.text())
    .then((html) => {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, "text/html");
        for (let meta of doc.getElementsByTagName('meta')) {
            if (meta.getAttribute('itemprop') === 'channelId') return meta.getAttribute('content');
        }
    })
}

let displayResults = (result) => {
    document.getElementById("totalViews").textContent = numberToString(result.totalViews);
    document.getElementById("totalComments").textContent = numberToString(result.totalComments);
    document.getElementById("totalLikes").textContent = numberToString(result.totalLikes);
    document.getElementById("averageViews").textContent = numberToString(result.averageViews);
    document.getElementById("averageComments").textContent = numberToString(result.averageComments);
    document.getElementById("averageLikes").textContent = numberToString(result.averageLikes);
    document.getElementById("totalVideos").textContent = numberToString(result.totalVideos);
    document.getElementById("averageVideos").textContent = numberToString(result.averageVideos) + "/day";
}

let parseInputs = () => {
    return {
        channelURL: document.getElementById('channelURL').value,
        fromDate: new Date(document.getElementById('fromDate').value),
        toDate: new Date(document.getElementById('toDate').value),
        apiKey: document.getElementById('apiKey').value,
    }
}

let analyzeVideosInfo = (videosInfo, days) => {
    let totalViews = 0;
    let totalComments = 0;
    let totalLikes = 0;

    for (let video of videosInfo) {
        totalViews += +video.viewCount;
        totalComments += +video.commentCount;
        totalLikes += +video.likeCount;
    }

    return {
        totalVideos: videosInfo.length,
        totalViews,
        totalComments,
        totalLikes,
        averageViews: (totalViews / videosInfo.length).toFixed(2),
        averageComments: (totalComments / videosInfo.length).toFixed(2),
        averageLikes: (totalLikes / videosInfo.length).toFixed(2),
        averageVideos: (videosInfo.length / days).toFixed(2),
    }
}

let validateInputs = ({channelURL, fromDate, toDate, apiKey}) => {
    let isValid = true;
    if (apiKey) setError("apiKey");
    else {
        isValid = false;
        setError("apiKey", "This field is required");
    }
    if (channelURL) setError("channelURL");
    else {
        isValid = false;
        setError("channelURL", "This field is required");
    }
    if (!!fromDate.getTime()) {
        if (!!toDate.getTime() && new Date(fromDate) > new Date(toDate)) {
            setError("fromDate", 
            "This date must be less then\n"+
            "'Posted before'");
        } else setError("fromDate");
    }
    else {
        isValid = false;
        setError("fromDate", "This field is required");
    }
    if (!!toDate.getTime()) setError("toDate");
    else {
        isValid = false;
        setError("toDate", "This field is required");
    }
    return isValid;
}

let onButtonClick = async () => {
    let inputs = parseInputs();
    inputs.channelId = await getChannelIdByURL(inputs.channelURL);
    if (validateInputs(inputs)) {
        let videosIds = await fetchVideosIds(inputs);
        if (!videosIds.length) return;
        let videosInfo = await fetchVideosInfo(videosIds, inputs.apiKey);

        let days = getDaysBetween(inputs.fromDate, inputs.toDate);

        let result = analyzeVideosInfo(videosInfo, days);
        displayResults(result);
    }
}

document.getElementById('analyzeButton').onclick = onButtonClick;