module.exports = function (arrayOrNot) {
  if (Array.isArray(arrayOrNot)) {
    return arrayOrNot.filter(function (item) { return item; });
  }

  return arrayOrNot;
};
