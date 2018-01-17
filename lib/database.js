var sqlite3 = require('sqlite3').verbose();

function schemaToTable(schema){
  return Object.keys(schema).map(key => `${key} ${schema[key]}`).join();
}

const cacheSchema = {
  url: 'text PRIMARY KEY',
  response: 'text',
  expiresAt: 'text',
};

const eventSchema = {
  id: 'text PRIMARY KEY',
  remoteId: 'text',
  remoteIdType: 'text',
  name: 'text',
  status: 'text',
  descriptionHtml: 'text',
  timeStart: 'text',
  timeEnd: 'text',
  timeCreated: 'text',
  timeUpdated: 'text',
  timeUpdated: 'text',
  countAttending: 'text',
  countCapacity: 'text',
  countWaitlist: 'text',
  venueId: 'text',
  organizerId: 'text',
  price: 'text',
  url: 'text',
  image: 'text',
};

const venueSchema = {
  id: 'text PRIMARY KEY',
  remoteId: 'text',
  remoteIdType: 'text',
  name: 'text',
  url: 'text',
  description: '',
  lat: 'text',
  lon: 'text',
  contactAddress: 'text',
  contactCity: 'text',
  contactCountry: 'text',
  contactPhone: 'text',
};

const organizerSchema = {
  id: 'text PRIMARY KEY',
  remoteId: 'text',
  remoteIdType: 'text',
  name: 'text',
  url: 'text',
  description: 'text',
  codeOfConduct: 'text'
};

function Database(options){
  const {filename, overrides} = options;
  this.overrides = overrides;
  var db = new sqlite3.Database(filename);
  db.serialize(function() {
    db.run(`CREATE TABLE IF NOT EXISTS cache (${schemaToTable(cacheSchema)})`);
    db.run(`CREATE TABLE IF NOT EXISTS events (${schemaToTable(eventSchema)})`);
    db.run(`CREATE TABLE IF NOT EXISTS venues (${schemaToTable(venueSchema)})`);
    db.run(`CREATE TABLE IF NOT EXISTS organizers (${schemaToTable(organizerSchema)})`);
  });
  //
  // process.exit();

  // db.run('DELETE FROM cache WHERE expiresAt < ?', new Date().toISOString());

  this.db = db;
}

Database.prototype.getCache = function(url, callback) {
  this.db.get("SELECT * FROM cache WHERE url = ?", url, callback);
}

Database.prototype.addCache = function(cache) {
  this.db.run("INSERT OR REPLACE INTO cache (url, response, expiresAt) VALUES (?, ?, ?)", [
    cache.url,
    cache.response,
    new Date(cache.expiresAt).toISOString()
  ]);
}

Database.prototype.addGeneric = function(table, schema, values){
  if(!values.id) return;
  if(!values.name) return;

  if(this.overrides[table]){
    this.overrides[table].forEach((candidate) => {
      const matches = candidate.nameLike.find(regex => {
        const compiledRegex = new RegExp(regex, 'i');
        const match = values.name.match(compiledRegex);
        return match;
      });
      if(matches){
        console.log('matched');
        Object.assign(values, candidate);
      }
    });
  }

  // TODO: apply aliases so we don't duplicate venues
  const items = Object.keys(schema);
  const mappedValues = items.map(key => values[key]);
  const query = `INSERT OR REPLACE INTO ${table} (${items}) VALUES (${items.map(a => '?').join()})`;
  this.db.run(query, mappedValues);
  return values;
}

Database.prototype.addEvent = function(event) {
  this.addGeneric('organizers', organizerSchema, event.organizer);
  event.organizerId = event.organizer.id;

  if(event.venue) {
    this.addGeneric('venues', venueSchema, event.venue);
    event.venueId = event.venue.id;
  }
  console.log(event.name, event.organizerId, event.venueId);

  this.addGeneric('events', eventSchema, event);
}

module.exports = Database;
