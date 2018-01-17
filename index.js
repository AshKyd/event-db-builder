#!/usr/bin/env node
const path = require('path');
const program = require('commander');
const Database = require('./lib/database');
const updateEvents = require('./lib/updateEvents');
const requireDirectory = require('require-directory');


program
  .version(require('./package').version)
  .option('-o, --overrides [path]', 'path to overrides json')
  .option('-d, --db [path]', 'sqlite database')
  .parse(process.argv);

const filename = program.db ? path.resolve(process.cwd(), program.db) : ':memory:';

let overrides = {
  organizers: {},
  venues: {},
};
if(program.overrides){
  overrides = requireDirectory(module, path.resolve(process.cwd(), program.overrides));
  Object.keys(overrides).forEach(function(key){
    overrides[key] = Object.keys(overrides[key]).map(subkey => overrides[key][subkey]);
  });
  console.log('overrides', program.overrides)
}

const db = new Database({
  filename,
  overrides,
});

updateEvents({
  db,
  overrides,
}, (error, allEvents) => {
  if(error) throw error;
  db.db.close();
});
