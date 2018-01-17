const meetup = require('./services/meetup');
const eventbrite = require('./services/eventbrite');
const utilities = require('./utilities');
const async = require('async');
const icalToolkit = require('ical-toolkit');
const RequestCache = require('./requestCache');

module.exports = function(options, callback){
  const { db } = options;
  const allEvents = [];
  const cache = new RequestCache({ db });

  async.auto({
    eventbrite: done => eventbrite({ cache, db }, done),
    meetup: done => meetup({ cache, db }, done),
  }, (error, result) => {
    if(error) return callback(error);
    // for debugging
    callback(error, allEvents);
  });
}
