const axios = require('axios');
const moment = require('moment-timezone');
const fs = require('fs');

const tokenSymbols = [
    'BTC', 'ETH', 'LTC', 'BCH', 'BNB', 'ADA', 'XMR', 'LINK', 'DASH', 'NEO'
]

// const tokenSymbol = 'BTC';
const withTokenSymbol = 'USDT';
const apiKey = 'cdc591b1638966047a2fe76dd5b8460815685823fb0fcd9e2eb0cb71c34fb8f2';

const instance = axios.create({
    headers: { 'authorization': 'Apikey ' + apiKey},
    responseType: 'json',
    crossDomain: true,
    withCredentials: true
});

function convertToDayOfWeek(numberDayOfWeek) {
    return numberDayOfWeek === 0? 'Sunday' :
        numberDayOfWeek === 1? 'Monday':
            numberDayOfWeek === 2? 'Tuesday':
                numberDayOfWeek === 3? 'Wednesday':
                    numberDayOfWeek === 4? 'Thursday':
                        numberDayOfWeek === 5? 'Friday':
                            'Saturday'
}

function chunkArrayInGroups(arr, size) {
    let myArray = [];
    for(let i = 0; i < arr.length; i += size) {
        myArray.push(arr.slice(i, i+size));
    }
    return myArray;
}

const ExportResult = {
    emoji: 'Emoji',
    vns: 'Tieng Viet',
    emotion: "Emotion"
}

function executingPrice(price, exportTo = ExportResult.emoji){
    if(exportTo == ExportResult.emoji) {
        return price > 0.4 && price <= 1 ? '🙂' :
        price > 1 && price <= 2 ? '😀' : 
        price > 2 && price <= 4 ? '😆' :  
        price > 4 ? '🤩' : 
        price < -0.4 && price >= -1 ? '🙁' :
        price < -1 && price >= -2 ? '😨' :
        price < -2 && price >= -4 ? '😱' :
        price < -4 ? '🥶' : 
        '😐'
    } else {
        return price > 0.4 && price <= 1 ? 'Tăng nhẹ' :
        price > 1 && price <= 2 ? 'Tăng ổn' : 
        price > 2 && price <= 4 ? 'Tăng tốt' :  
        price > 4 ? 'Wow!!!' : 
        price < -0.4 && price >= -1 ? 'Giảm nhẹ' :
        price < -1 && price >= -2 ? 'Giảm khá' :
        price < -2 && price >= -4 ? 'Giảm mạnh' :
        price < -4 ? 'What the *' : 
        'Hmm'
    }
    
}
tokenSymbols.forEach(tokenSymbol => {
instance.get('https://min-api.cryptocompare.com/data/v2/histohour?fsym=' + tokenSymbol + '&tsym=' + withTokenSymbol + '&toTs=1571590800' )
    .then(response => {
        const data = response.data.Data.Data;
        const preProcessedData = data.map( (curData, index) => {
            const nextData = typeof data[index + 1] != "undefined" ? data[index + 1] : data[0];
            
            const timeFrom = moment(curData.time * 1000).tz('Asia/Ho_Chi_Minh');
            const timeFromDate = timeFrom.format('YYYY-MM-DD');
            const timeFromTime = timeFrom.format('HH:mm');
            const timeFromDayOfWeek = convertToDayOfWeek(timeFrom.day());

            const timeTo = moment(nextData.time * 1000).tz('Asia/Ho_Chi_Minh');
            const timeToDate = timeTo.format('YYYY-MM-DD');
            const timeToTime = timeTo.format('HH:mm');
            const timeToDayOfWeek = convertToDayOfWeek(timeTo.day());

            const priceOpen = curData.open;
            const priceClosed = curData.close;
            const cal = (priceClosed - priceOpen)*100/priceOpen;
            return {
                'date': timeFromDayOfWeek + ' ' + timeFromDate,
                'time': timeFromTime + ' - ' + timeToTime,
                'priceChange': cal
            }
        })
        fs.writeFile('./ApiResult/' + tokenSymbol + '-' + withTokenSymbol +".json",  JSON.stringify(preProcessedData, null, 4), function(err) {

            if(err) {
                return console.log(err);
            }

            console.log('Api result: ' + tokenSymbol + '-' + withTokenSymbol + " was saved!");
        });
        const processedData = chunkArrayInGroups(preProcessedData, 24);
        const titleBar = '-,' + processedData[0].map(e=> e.time).join(',') + '\n';
        const content = processedData.map(dailyInWeek => {
                return dailyInWeek[0].date + ',' + dailyInWeek.map(daily => executingPrice(daily.priceChange, ExportResult.vns)).join(',') 
            }
        ).join('\n');
        fs.writeFile('./AnalysisResult/' + tokenSymbol + '-' + withTokenSymbol +".csv", titleBar + content, function(err) {

            if(err) {
                return console.log(err);
            }

            console.log('Analysis result: ' + tokenSymbol + '-' + withTokenSymbol + " was saved!");
        });
    }).catch(err => console.log('Error: ',err));
});