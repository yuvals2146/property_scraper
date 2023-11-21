csvRows = [];

const { appendFileSync } = require("fs");

const initCSV = (data) => {
  const headers = Object.keys(data);
  csvRows.push(headers.join(","));
};

const addRow = (data) => {
  const values = Object.values(data).join(",");
  csvRows.push(values);
};

const saveCSV = function () {
  const timestamp = new Date().getTime();
  try {
    appendFileSync(`./properties-${timestamp}.csv`, csvRows.join("\r\n"));
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  initCSV,
  addRow,
  saveCSV,
};
