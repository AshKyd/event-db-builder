const async = require('async');
const sqlite3 = require('sqlite3').verbose();
const { detergent } = require('detergent');

/**
 * TODO: make this good-like
 */
function sanitise(string){
  if (typeof string !== 'string') return string;
  return string.replace(' ', '');
}

function schemaToTable(schema) {
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
  codeOfConduct: 'text',
};

function deepEql(schema, a, b) {
  if(!a) return true;
  const hasDifference = Object.keys(schema).find((key) => {
    // ignore these evergreen fields
    if(['id', 'timeCreated', 'timeUpdated', 'timeLastSeen', 'timeEnd'].includes(key)) return;

    const comparA = String(a[key]);
    const comparB = String(b[key]);

    if(comparB === 'undefined') return;

    if(comparB && typeof comparB !== 'object' && comparB !== comparA){
      console.log('found differing key', key, comparA, comparB)
      return true;
    }
  });
  return hasDifference;
}

function Database(options) {
  const { filename, overrides } = options;
  this.overrides = overrides;
  const db = new sqlite3.Database(filename);
  db.serialize(() => {
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

Database.prototype.getCache = function (url, callback) {
  this.db.get('SELECT * FROM cache WHERE url = ?', url, callback);
};

Database.prototype.addCache = function (cache) {
  this.db.run('INSERT OR REPLACE INTO cache (url, response, expiresAt) VALUES (?, ?, ?)', [
    cache.url,
    cache.response,
    new Date(cache.expiresAt).toISOString(),
  ]);
};

Database.prototype.addGenericIfValuesExist = (...args) => {
  const [table, schema, values, cb] = args;
  if (!values) return cb();
  return this.addGeneric(...args);
};

Database.prototype.addGeneric = function (table, schema, values, cb) {
  const callback = cb || (() => {});
  if (!values.id) return callback();
  if (!values.name) return callback();

  if (this.overrides[table]) {
    this.overrides[table].forEach((candidate) => {
      const matches = candidate.nameLike.find((regex) => {
        const compiledRegex = new RegExp(regex, 'i');
        const match = values.name.match(compiledRegex);
        return match;
      });

      if (matches) {
        Object.assign(values, candidate);
        delete values.remoteIdType;
        delete values.remoteId;
      }
    });
  }

  // Normalise data somewhat.
  Object.keys(values).forEach((key) => {
    if(values[key] && key.substr(0,4) === 'time'){
      values[key] = new Date(values[key]).toISOString();
    }
    if(values[key]) {
      values[key] = String(values[key]).trim();
    }
  })

  const select = `SELECT * from ${table} where id="${values.id}"`;
  this.db.get(select, (error, fetchedItem) => {
    const items = Object.keys(schema);

    if (!deepEql(schema, fetchedItem, values)) {
      return callback(null, values);
    }

    const mappedValues = items.map(key => values[key]);
    const query = `INSERT OR REPLACE INTO ${table} (${items.map(sanitise)}) VALUES (${items.map(a => '?').join()})`;
    console.log('inserting', table, values.name);
    this.db.run(query, mappedValues, (error) => {
      return callback(error, values);
    });
  });
};

Database.prototype.addEvent = function (event, callback) {
  if (event.venue) event.venueId = event.venue.id;
  async.auto({
    organizers: done => this.addGenericIfValuesExist('organizers', organizerSchema, event.organizer, done),
    venue: done => this.addGenericIfValuesExist('venues', venueSchema, event.venue, done),
    events: ['organizers', (values, done) => {
      if(values.organizers) event.organizerId = values.organizers.id;
      this.addGeneric('events', eventSchema, event, callback, done);
    }],
  }, callback);
};

module.exports = Database;
