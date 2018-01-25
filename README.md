Event DB Builder
================

Build a sqlite database of events matching given location params.

## For developers
Pull requests are welcome.

## For users

1. Make an [Eventbrite Application Key](https://www.eventbrite.com/support/articles/en_US/How_To/how-to-locate-your-eventbrite-api-user-key?lg=en_US#5)
1. Make a [Meetup.com key](https://secure.meetup.com/meetup_api/key/)
1. Create a config file (see [config.json.example](config.json.example)) to set up location, API keys and cache time
1. Set up any overrides for the database. For examples, see the [eventsbne.me-generated repo](https://github.com/eventsbne/eventsbne.me-generated/tree/master/overrides)
1. Run the application on the command line

### Command line usage

```
  Usage: event-db-builder [options]


  Options:

    -V, --version           output the version number
    -c, --config [path]     path to config
    -o, --overrides [path]  path to overrides json
    -d, --db [path]         sqlite database
    -h, --help              output usage information
```
