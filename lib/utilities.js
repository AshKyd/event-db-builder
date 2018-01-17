module.exports = {
  unique(items){
    const indexes = {
      meetup: [],
      eventbrite: [],
    };
    return items.filter((item) => {
      const isUnique = !item.remoteId.find(remote => {
        const found = indexes[remote.type].includes(remote.id);
        indexes[remote.type].push(remote.id);
        return found;
      });
      return !!isUnique;
    });
  }
};
