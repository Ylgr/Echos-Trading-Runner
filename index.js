const axios = require('axios');
const moment = require('moment-timezone');
const fs = require('fs');

const tokenSymbols = [
    'BTC', 
    'ETH', 
    'LTC', 
    'BCH', 
    'BNB', 
    'ADA', 
    'XMR', 
    'LINK', 
    'DASH', 
    'NEO',
    'ATOM',
    'VET',
    'EOS',
    'ONT',
    'XLM',
    'XRP',
    'VET',
    'BAT'
]
const toTS = '1573059600'; // Thuday, November 7, 2019 12:00:00 AM GMT+07:00
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

const ExportType = {
    emoji: 'Emoji',
    vns: 'Tieng Viet',
    emotion: "Emotion",
    default: "Default"
}

const ExecutedTime = {
    hourly: 'Hourly',
    weekly: 'Weekly'
}
const CaculatetdElement = {
    openClose: 'Open - Close',
    highLow: 'High - Low'
}
function executingPrice(price, exportTo = ExportType.default){
    if(exportTo == ExportType.emoji) {
        return price > 0.3 && price <= 1 ? '🙂' :
        price > 1 && price <= 2 ? '😀' : 
        price > 2 && price <= 4 ? '😆' :  
        price > 4 ? '🤩' : 
        price < -0.3 && price >= -1 ? '🙁' :
        price < -1 && price >= -2 ? '😨' :
        price < -2 && price >= -4 ? '😱' :
        price < -4 ? '🥶' : 
        '-'
    } else if (ExportType.vns) {
        return price > 0.3 && price <= 1 ? 'Tăng nhẹ' :
        price > 1 && price <= 2 ? 'Tăng ổn' : 
        price > 2 && price <= 4 ? 'Tăng tốt' :  
        price > 4 ? 'Wow!!!' : 
        price < -0.3 && price >= -1 ? 'Giảm nhẹ' :
        price < -1 && price >= -2 ? 'Giảm khá' :
        price < -2 && price >= -4 ? 'Giảm mạnh' :
        price < -4 ? 'What the *' : 
        '-'
    } else price
    
}

function executingHighLow(price, exportTo = ExportType.default){
    if (ExportType.vns) {
        return price > 0.6 && price <= 1.2 ? 'Nhẹ' :
        price > 1.2 && price <= 2.8 ? 'Khá' : 
        price > 2.8 && price <= 5 ? 'Mạnh' :  
        price > 5 ? 'Wow!!!' : 
        '-'
    } else price
    
}
function writeToFile(name, content) {
    fs.writeFile(name, content, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log(name + " was saved!");
    });
}

function processingContent(data, exportType = ExportType.default, caculatedBy = CaculatetdElement.openClose ,excutedTime = ExecutedTime.hourly) {
    return data.map(dailyInWeek => {
        return dailyInWeek[0].date + ',' + dailyInWeek.map(daily => {
            if(caculatedBy == CaculatetdElement.highLow){
                return executingHighLow(daily.priceChange, exportType);
            } else {
                return executingPrice(daily.priceChange, exportType);
            }
             
        }).join(',')
    }).join('\n');
}

const aggregate = '2';
const aggregatePredictableTimePeriods = 'false'
tokenSymbols.forEach(tokenSymbol => {
instance.get('https://min-api.cryptocompare.com/data/v2/histohour?fsym=' + tokenSymbol + '&tsym=' + withTokenSymbol + '&toTs=' + toTS + '&aggregate=' + aggregate + '&aggregatePredictableTimePeriods=' + aggregatePredictableTimePeriods + '&limit=840')
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
            const priceHigh = curData.high;
            const priceLow = curData.low;
            const calOP = (priceClosed - priceOpen)*100/priceOpen;
            const calHL = (priceHigh - priceLow)*100/priceLow;
            return {
                'date': timeFromDayOfWeek + ' ' + timeFromDate,
                'time': timeFromTime + ' - ' + timeToTime,
                'priceChange': calOP,
                'priceChangeHighLow': calHL
            }
        })
        writeToFile('./ApiResult/' + tokenSymbol + '-' + withTokenSymbol +".json",  JSON.stringify(preProcessedData, null, 4));
        if(aggregate/24 < 1) {
            const processedData = chunkArrayInGroups(preProcessedData, 24 / aggregate);
            const titleBar = '-,' + processedData[0].map(e => e.time).join(',') + '\n';
            const contentOpenClose = processingContent(processedData, ExportType.vns, CaculatetdElement.openClose);
            const contentHighLow = processingContent(processedData, ExportType.vns, CaculatetdElement.highLow);
            writeToFile('./AnalysisResult/open-close/feeling/' + tokenSymbol + '-' + withTokenSymbol +".csv", titleBar + contentOpenClose);
            writeToFile('./AnalysisResult/high-low/feeling/' + tokenSymbol + '-' + withTokenSymbol +".csv", titleBar + contentHighLow);
        } else {
            const processedData = chunkArrayInGroups(preProcessedData, 7);
            const titleBar = '-,' + processedData[0].map(e => e.date).join(',') + '\n';
            const content = processingContent(processedData, ExportType.vns);
        }

    }).catch(err => console.log('Error: ',err));
});