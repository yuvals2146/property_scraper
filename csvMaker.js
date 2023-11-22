csvRows = [];

invalidAddresses = [];

const { appendFileSync } = require("fs");

const initCSV = (data, valid) => {
  if (valid) {
    const headers = Object.keys(data);
    csvRows.push(headers.join(","));
  } else {
    const headers = Object.keys(data);
    invalidAddresses.push(headers.join(","));
  }
};

const addRow = (data, valid) => {
  const values = Object.values(data).join(",");
  if (valid) {
    console.log("add to valid");
    csvRows.push(values);
  } else {
    console.log("add to *unvalid*");
    invalidAddresses.push(values);
  }
};

const saveCSV = function (valid) {
  const timestamp = new Date().getTime();
  const flieName = valid
    ? `./artifacts/properties-${timestamp}.csv`
    : `./artifacts/invalid-addresses-${timestamp}.csv`;
  const table = valid ? csvRows : invalidAddresses;
  try {
    appendFileSync(flieName, table.join("\r\n"));
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  initCSV,
  addRow,
  saveCSV,
};
