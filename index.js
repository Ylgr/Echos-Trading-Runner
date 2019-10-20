const axios = require('axios');
const tokenSymbol = 'BTC';
const withTokenSymbol = 'USDT';
const apiKey = 'cdc591b1638966047a2fe76dd5b8460815685823fb0fcd9e2eb0cb71c34fb8f2';

const instance = axios.create({
    headers: { 'authorization': 'Apikey ' + apiKey},
    responseType: 'json',
    crossDomain: true,
    withCredentials: true
});

instance.get('https://min-api.cryptocompare.com/data/v2/histohour?fsym=' + tokenSymbol + '&tsym=' + withTokenSymbol + '&toTs= 1571594400' )
    .then(response => {
        const timeFrom = Date(response.data.Data.TimeFrom);
        const timeTo = Date(response.data.Data.TimeTo);
        const data = response.data.Data.Data;
        data.forEach( (curData, index) => {
            const nextData = data[index + 1];
            if(typeof nextData != "undefined") {
                console.log('From: ', Date(curData.time));
                console.log('To: ', Date(nextData.time));
                const priceOpen = curData.open;
                const priceClosed = curData.close;
                const cal = (priceClosed - priceOpen)*100/priceOpen;
                console.log('Change: ', cal);
            }
        })
    }).catch(err => console.log('Error: ',err));