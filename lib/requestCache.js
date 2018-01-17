const async = require('async');
const request = require('request');

function RequestCache(options){
  const { db } = options;
  this.db = db;
}

RequestCache.prototype.add = function(options){
  const { url, response, expiresAt } = options;
  this.db.addCache({ url, response, expiresAt });
}

RequestCache.prototype.request = function(url, cacheTime, callback){
  async.waterfall([
    (done) => {
      this.db.getCache(url, (error, contents) => {
        if(error || !contents) {
          console.log('requesting url', url);
          return done();
        }
        return callback(null, contents.response);
      });
    },
    (done) => request(url, done),
    (res, response, done) => {

      this.add({
        url,
        expiresAt: Date.now() + cacheTime,
        response,
      });
      done(null, response)
    }
  ], callback);
}



module.exports = RequestCache;
