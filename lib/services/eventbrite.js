const async = require('async');
const request = require('request');
const createId = require('./createId');
const {VM} = require('vm2');
const requestCache = require('../requestCache');
const topicCategories = {
  tech: 102,
  lgbtq: 585,
};
const dateNow = new Date();
function parseEvent(event){
  return{
    id: createId([event.id, 'eventbrite'].join()),
    remoteId: event.id,
    remoteIdType: 'eventbrite',
    name: event.name.text,
    status: event.status,
    descriptionHtml: event.description.html,
    timeCreated: dateNow,
    timeStart: new Date(event.start.utc),
    timeEnd: new Date(event.end.utc),
    timeUpdated: dateNow,
    timeLastSeen: dateNow,
    countAttending: null,
    countCapacity: event.capacity,
    countWaitlist: null,
    price: event.is_free ? 'Free' : 'Paid',
    url: event.url,
    image: event.logo && event.logo.original.url,
    eventType: 'meetup',
  }
}

function parseGnarlyJson(data, key){
  const match = data.match(new RegExp(`"${key}":"?([^"]+)"?`));
  if(match){
    const value = match[1];
    if(match.includes('{')) return null;

    // remove commas from numbers overmatched in regex
    if(value.match(/,$/)) return value.substr(0,value.length-1);
    return value.trim();
  } else {
    // TODO: flag it, dump it, do something'
    return null;
  }
}

function fetchNastyContent(options, callback){
  const { config, event, cache } = options;
  const url = event.url;
  cache.request(url, config.cacheTime, (error, data) => {
    if(error) return callback(error);
    // The eventbrite page has all the info we need in it.

    const venueSubset = data.substr(data.indexOf('"venue"') + 5);
    const venueId = parseGnarlyJson(venueSubset, 'public_id');
    const parsedVenue = {
      id: createId([venueId, 'eventbrite'].join()),
      remoteId: venueId,
      remoteIdType: 'eventbrite',
      name: parseGnarlyJson(venueSubset, 'venue'),
      lat: parseGnarlyJson(venueSubset, 'latitude'),
      lon: parseGnarlyJson(venueSubset, 'longitude'),
      url: null,
      contactAddress: parseGnarlyJson(venueSubset, 'localized_address_display'),
      contactCity: parseGnarlyJson(venueSubset, 'city'),
      contactCountry: parseGnarlyJson(venueSubset, 'country'),
      contactPhone: null,
    };

    const organizerSubset = data.substr(data.indexOf('"organizer"') + 5);
    const organizerId = (parseGnarlyJson(organizerSubset, 'url') || '').match(/[^\/]*$/)[0];

    const parsedOrganizer = {
      id: createId([organizerId, 'eventbrite'].join()),
      remoteId: organizerId,
      remoteIdType: 'eventbrite',
      name: parseGnarlyJson(organizerSubset, 'name'),
      url: parseGnarlyJson(organizerSubset, 'url'),
      description: parseGnarlyJson(organizerSubset, 'description'),
      codeOfConduct: null,
    };

    callback(null, [parsedVenue, parsedOrganizer]);
  });
}

function fetchEvent(options, page, callback){
  const { config, cache, db } = options;
  console.log('requesting eventbrite index page ', page);
  const url = `https://www.eventbriteapi.com/v3/events/search/?location.within=50km&location.latitude=${config.lat}&location.longitude=${config.lon}&&categories=${topicCategories.tech}&token=${config.eventbrite.key}&page=${page}`;
  cache.request(url, config.cacheTime, function(error, data){
    if(error) return callback(error);
    const parsed = JSON.parse(data);
    const events = parsed.events
      .filter(event => !event.online_event)
      .map(original => ({
        original,
        event: parseEvent(original),
      }));

    async.mapLimit(events, 1, (data, doneMap) => {
      const {event} = data;
      const venueId = data.original.venue_id;
      fetchNastyContent({config, event, cache}, (error, content) => {
        if(error) return doneMap(error);
        const [venue, organizer] = content;
        event.venue = venue;
        event.organizer = organizer;
        event.venueId = venue.id;
        event.organizerId = organizer.id;

        db.addEvent(event, doneMap);
      });
    }, (error) => {
      if(error) return callback(error);
      if(parsed.pagination.has_more_items){
        return fetchEvent(options, page + 1, callback);
      } else {
        return callback();
      }
    });
  });
}

module.exports = function(options, callback){
  fetchEvent(options, 1, callback)
}
