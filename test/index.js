const assert = require('assert');
const utils = require('../lib/utilities');


describe('utilities', () => {
  describe('unique', () => {
    it('should get unique IDs for a meetup', () => {
      const items = [
        {
          remoteId: [
            { type: 'meetup', id: 1 },
          ]
        },
        {
          remoteId: [
            { type: 'meetup', id: 1 },
          ]
        },
      ]
      assert.equal(utils.unique(items).length, 1);
    });
    it('should get unique IDs with a mix of types', () => {
      const items = [
        {
          remoteId: [
            { type: 'eventbrite', id: 2 },
            { type: 'meetup', id: 1 },
          ]
        },
        {
          remoteId: [
            { type: 'meetup', id: 1 },
          ]
        },
      ]
      assert.equal(utils.unique(items).length, 1);
    });
    it('should get unique IDs with a mix of types', () => {
      const items = [
        {
          remoteId: [
            { type: 'eventbrite', id: 1 },
          ]
        },
        {
          remoteId: [
            { type: 'meetup', id: 1 },
          ]
        },
      ]
      assert.equal(utils.unique(items).length, 2);
    });
  });
});
