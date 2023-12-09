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
    csvRows.push(values);
  } else {
    invalidAddresses.push(values);
  }
};

const saveCSV = function (closeResonse) {
  const timestamp = new Date().getTime();
  const flieNameValid = `properties-${timestamp}.csv`;
  const filePath = closeResonse ? `./artifacts/full/` : `./artifacts/errors/`;
  try {
    appendFileSync(`${filePath}${flieNameValid}`, csvRows.join("\r\n"));
  } catch (err) {
    console.error(err);
  }
};

const saveFaliedinvalidAddresses = function (closeResonse) {
  const timestamp = new Date().getTime();
  const flieNameInvalid = `invalid-addresses-${timestamp}.csv`;
  const filePath = closeResonse ? `./artifacts/full/` : `./artifacts/errors/`;
  try {
    appendFileSync(
      `${filePath}${flieNameInvalid}`,
      invalidAddresses.join("\r\n")
    );
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  initCSV,
  addRow,
  saveCSV,
  saveFaliedinvalidAddresses,
};
