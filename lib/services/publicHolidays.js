const async = require('async');
const createId = require('./createId');
const moment = require('moment-timezone');

const dateNow = new Date();
function parseEvent(event, config) {
  // 20170101

  const date = moment(event[0], 'YYYYMMDD').tz(config.timezone);
  const dateEnd = date.clone().add(1, 'd');
  return {
    id: ['holiday', event[0]].join('-'),
    remoteId: event.id,
    remoteIdType: 'holiday',
    name: event[1],
    status: null,
    descriptionHtml: event[2],
    timeCreated: dateNow,
    timeStart: date.toDate(),
    timeEnd: dateEnd.toDate(),
    timeUpdated: dateNow,
    timeLastSeen: dateNow,
    countAttending: null,
    countCapacity: null,
    countWaitlist: null,
    price: 'Free',
    url: event[3],
    image: null,
    eventType: 'public holiday',
  };
}
function fetchEvent(options, page, callback) {
  const { config, cache, db } = options;
  console.log('requesting public holidays ');
  const url = 'https://data.gov.au/dataset/b1bc6077-dadd-4f61-9f8c-002ab2cdff10/resource/253d63c0-af1f-4f4c-b8d5-eb9d9b1d46ab/download/australianpublicholidays-201718.csv';
  cache.request(url, config.cacheTime, (error, data) => {
    if (error) return callback(error);
    const events = data
      .split('\n')
      .map(row => row.split(','))
      .filter(row => config.publicHolidaysStates.find(state => row[4].includes(state)))
      .map(e => parseEvent(e, config));
    async.each(events, db.addEvent.bind(db), callback);
  });
}

module.exports = function (options, callback) {
  fetchEvent(options, 1, callback);
};
