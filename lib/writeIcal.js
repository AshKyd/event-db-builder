module.exports = function(allEvents){

  var builder = icalToolkit.createIcsFileBuilder();
    builder.calname = 'Brisbane Tech Events';

    allEvents.forEach(event => builder.events.push({

    //Event start time, Required: type Date()
    start: new Date(event.timeStart),

    //Event end time, Required: type Date()
    end: new Date(event.timeEnd ? event.timeEnd : event.timeStart + 1000 * 60 * 60),

    //transp. Will add TRANSP:OPAQUE to block calendar.
    transp: 'OPAQUE',

    //Event summary, Required: type String
    summary: event.name,

    //Event identifier, Optional, default auto generated
    uid: JSON.stringify(event.remoteId),

    //Creation timestamp, Optional.
    stamp: new Date(event.timeCreated),

    //Location of event, optional.
    location: event.venue ? `${event.venue.name},
  ${event.venue.contact.address},
  ${event.venue.contact.city},
  ${event.venue.contact.country}` : 'Brisbane, Australia',

    //Optional description of event.
    description: `Event from eventsbne.me. For more info: ${event.url}`,

  }));

  var icsFileContent = builder.toString();
  require('fs').writeFileSync('ical.ical', icsFileContent);
}
