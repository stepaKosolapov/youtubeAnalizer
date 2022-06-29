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

let extractCoordsFromExcelAddress = (address) => {
    let letter = '';
    let number = '';
    for (let c of address) {
        if (/^\d+$/.test(c)) number+=c;
        else letter += c.toUpperCase();
    }
    return {letter, number: +number};
}