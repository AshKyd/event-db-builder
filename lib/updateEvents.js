const meetup = require('./services/meetup');
const eventbrite = require('./services/eventbrite');
const publicHolidays = require('./services/publicHolidays');
const async = require('async');
const RequestCache = require('./requestCache');

module.exports = (options, callback) => {
  const { config, db } = options;
  const allEvents = [];
  const cache = new RequestCache({ db });

  async.auto({
    publicHolidays: done => publicHolidays({ config, cache, db }, done),
    // eventbrite: done => eventbrite({ config, cache, db }, done),
    // meetup: done => meetup({ config, cache, db }, done),
  }, (error) => {
    if (error) return callback(error);
    // for debugging
    return callback(error, allEvents);
  });
};
