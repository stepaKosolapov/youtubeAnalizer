let workbook;

let exportToExcel = function() {
    if (workbook == null) {
        alert('Workbook is empty! \nPlease, type something in the form!');
        return;
    }
    XLSX.writeFile(workbook, 'analysis.xlsx');
}

async function handleFileAsync(e) {
    const file = e.target.files[0];
    if (!file) {
        document.querySelector('label.fileUploadButton').style.backgroundColor = "rgb(109, 109, 109)";
        return;
    }
    const data = await file.arrayBuffer();
    workbook = XLSX.read(data);
    console.log('read');
    document.querySelector('label.fileUploadButton').style.backgroundColor = "#6da050";
}

document.getElementById("fileUpload").addEventListener("change", handleFileAsync, false);

let parseExcelInputs = () => {
    return {
        totalViewsColumn: document.getElementById('totalViewsColumn').textContent.trim(),
        averageViewsColumn: document.getElementById('averageViewsColumn').textContent.trim(),
        totalCommentsColumn: document.getElementById('totalCommentsColumn').textContent.trim(),
        averageCommentsColumn: document.getElementById('averageCommentsColumn').textContent.trim(),
        totalLikesColumn: document.getElementById('totalLikesColumn').textContent.trim(),
        averageLikesColumn: document.getElementById('averageLikesColumn').textContent.trim(),
        totalVideosColumn: document.getElementById('totalVideosColumn').textContent.trim(),
        averageVideosColumn: document.getElementById('averageVideosColumn').textContent.trim(),
        urlColumn: document.getElementById('urlColumn').value.trim(),
        channelIdColumn: document.getElementById('channelIdColumn').value.trim(),
        fromDate: new Date(document.getElementById('fromDate').value),
        toDate: new Date(document.getElementById('toDate').value),
        apiKey: document.getElementById('apiKey').value.trim(),
    }
}

let processTable = async () => {
    if (!workbook) return;
    const {
        totalViewsColumn,
        averageViewsColumn,
        totalCommentsColumn,
        averageCommentsColumn,
        totalLikesColumn,
        averageLikesColumn,
        totalVideosColumn,
        averageVideosColumn,
        channelIdColumn,
        urlColumn,
        fromDate,
        toDate,
        apiKey,
    } = parseExcelInputs();
    const {letter: urlLetter, number: urlNumber} = extractCoordsFromExcelAddress(urlColumn);
    const {letter: channelIdlLetter, number: channelIdNumber} = extractCoordsFromExcelAddress(channelIdColumn);
    const totalUrls = countAllUrls(urlLetter, urlNumber);
    changeProgressCounter(0, totalUrls);
    let i = 0;
    while(i < totalUrls) {
        increaseProgressCounter();
        let channelId;
        if (!getValue(channelIdlLetter, channelIdNumber+i)) {
            channelId = await getChannelIdByURL(getValue(urlLetter, urlNumber+i));
            setValue(channelIdlLetter, channelIdNumber+i, channelId);
        } else channelId = getValue(channelIdlLetter, channelIdNumber+i);

        if (!channelId) {
            i++;
            continue;
        }
        
        const result = await process(channelId, fromDate, toDate, apiKey);
        if (totalVideosColumn) {
            let {letter, number} = extractCoordsFromExcelAddress(totalVideosColumn);
            setValue(letter, number+i, result.totalVideos);
        }
        if (totalViewsColumn) {
            let {letter, number} = extractCoordsFromExcelAddress(totalViewsColumn);
            setValue(letter, number+i, result.totalViews);
        }
        if (totalCommentsColumn) {
            let {letter, number} = extractCoordsFromExcelAddress(totalCommentsColumn);
            setValue(letter, number+i, result.totalComments);
        }
        if (totalLikesColumn) {
            let {letter, number} = extractCoordsFromExcelAddress(totalLikesColumn);
            setValue(letter, number+i, result.totalLikes);
        }
        if (averageViewsColumn) {
            let {letter, number} = extractCoordsFromExcelAddress(averageViewsColumn);
            setValue(letter, number+i, result.averageViews);
        }
        if (averageCommentsColumn) {
            let {letter, number} = extractCoordsFromExcelAddress(averageCommentsColumn);
            setValue(letter, number+i, result.averageComments);
        }
        if (averageLikesColumn) {
            let {letter, number} = extractCoordsFromExcelAddress(averageLikesColumn);
            setValue(letter, number+i, result.averageLikes);
        }
        if (averageVideosColumn) {
            let {letter, number} = extractCoordsFromExcelAddress(averageVideosColumn);
            setValue(letter, number+i, result.averageVideos);
        }
        i++;
    }

    console.log('done');
    exportToExcel();
};

let countAllUrls = (letter, number) => {
    let i = 0;
    while(getValue(letter, number+i)) {
        i++;
    }
    return i;
}

let getValue = (letter, number) => {
    return workbook.Sheets[workbook.SheetNames[0]][`${letter}${number}`]?.v;
}

let setValue = (letter, number, value) => {
    console.log(letter, number, value);
    XLSX.utils.sheet_add_aoa(workbook.Sheets[workbook.SheetNames[0]], [[value]], { origin: `${letter}${number}` });
}

let increaseProgressCounter = () => {
    const counter = document.getElementById('progressCounter');
    changeProgressCounter(+counter.textContent.split('/')[0] + 1, counter.textContent.split('/')[1]);
}

const changeProgressCounter = (newValue, goal) => {
    const counter = document.getElementById('progressCounter');
    counter.textContent = `${newValue} / ${goal}`;
    console.log('changing', 100 - (newValue / goal) * 100);
    
    if (+goal === 0) {
        document.querySelector('.progressCounterWrapper .progressBar').style.right = "100%";
        return;
    }

    document.querySelector('.progressCounterWrapper .progressBar').style.right = `${100 - (newValue / goal) * 100}%`;
};
document.getElementById('fileDownload').addEventListener('click', processTable);