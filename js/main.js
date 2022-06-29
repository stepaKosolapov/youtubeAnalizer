for (let el of document.querySelectorAll(".pageContainer[data-page-index='0'] .cell")) {
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
        averageViews: videosInfo.length ? (totalViews / videosInfo.length).toFixed(2) : 0,
        averageComments: videosInfo.length ? (totalComments / videosInfo.length).toFixed(2) : 0,
        averageLikes: videosInfo.length ? (totalLikes / videosInfo.length).toFixed(2) : 0,
        averageVideos: videosInfo.length ? (videosInfo.length / days).toFixed(2) : 0,
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

var process = async (channelId, fromDate, toDate, apiKey) => {
    let videosIds = await fetchVideosIds(channelId, fromDate, toDate, apiKey);
    console.log(videosIds.length, channelId);
    let videosInfo = await fetchVideosInfo(videosIds, apiKey);

    let days = getDaysBetween(fromDate, toDate);

    let result = analyzeVideosInfo(videosInfo, days);
    return result;
}

let onButtonClick = async () => {
    let inputs = parseInputs();
    inputs.channelId = await getChannelIdByURL(inputs.channelURL);
    if (validateInputs(inputs)) {
        const {channelId, fromDate, toDate, apiKey} = inputs;
        let result = await process(channelId, fromDate, toDate, apiKey)
        displayResults(result);
    }
}

document.getElementById('analyzeButton').onclick = onButtonClick;