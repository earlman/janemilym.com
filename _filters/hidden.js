module.exports = {
   removeHidden: (array) => {
      const a = array.filter((item) => {
         return !item.data.hidden;
      });
      return a;
   },
};
