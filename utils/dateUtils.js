const getFormatedDate = () => {
  const date = new Date();
  const yyyy = date.getFullYear().toString();
  const mm = (date.getMonth() + 1).toString();
  const dd = date.getDate().toString();

  return [
    yyyy,
    mm.length < 2 ? "0" + mm : mm,
    dd.length < 2 ? "0" + dd : dd,
  ].join("-");
};

module.exports = {
  getFormatedDate,
};
