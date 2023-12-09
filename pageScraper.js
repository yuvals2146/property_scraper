// Purpose: Scrape data from Broward County Property Appraiser
const {
  saveCSV,
  saveFaliedinvalidAddresses,
  initCSV,
  addRow,
} = require("./csvMaker");

var csv = require("csvtojson");

let noResultsFoundCount = 0;
let multipleResultsFoundCount = 0;
let noUpdateNeededCount = 0;
let newCity = "";
let errorMessages;
let startTime = new Date().getTime();
let cleanExit = false;
// create a cluster that handles 10 parallel browsers
const cluster = await Cluster.launch({
  concurrency: Cluster.CONCURRENCY_BROWSER,
  maxConcurrency: 10,
});

const scraperObject = {
  //Change url to link you're scraping from
  url: "https://web.bcpa.net/BcpaClient/#/Record-Search",

  async scraper(browser) {
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);

    //Enter following code here
    // await page.waitForSelector("#txtField");
    // await page.type("#txtField", "7311 LYONS RD");
    // await page.keyboard.press("Enter"); // Enter Key
    // await page.waitForTimeout(3000);

    await initialCSV();
    const inputAdresses = [];
    //const properties = await importProperties("./test.csv");
    
    const properties = await importProperties("./finle.csv");
    const propertiesLength = properties.length;
    for (i = 0; i < propertiesLength; i++) {
      if (!properties[i].ADDRESS) {
        continue;
      }

      if (!properties[i]["PROPERTY OWNER"]) {
        try {
          await page.goto(this.url, { waitUntil: "networkidle0" });
          await page.waitForSelector("#txtField");
          await page.type("#txtField", properties[i].ADDRESS);
        } catch (err) {
          console.log("Error with page");
          console.log(err);
          addRow(
            {
              address: inputAdresses[i],
              multipleResults: false,
              internalError: true,
            },
            false
          );
          continue;
        }
        // count li elements under ul with id="results"
        try {
          await page.waitForSelector("#results > li", { timeout: 5000 });
        } catch (err) {
          console.log("No results found!");
          noResultsFoundCount++;
          errorMessages = "No results found!";
          addRow(
            {
              address: inputAdresses[i],
              multipleResults: false,
              internalError: false,
            },
            false
          );
        }

        const results = (await page.$$("#results > li")).length;

        if (results > 1) {
          console.log("Multiple results found!");
          multipleResultsFoundCount++;
          addRow(
            {
              address: properties[i]["ADDRESS"],
              multipleResults: true,
              internalError: false,
              amountOfResults: results,
            },
            false
          );

          errorMessages = `Multiple [${
            results >= 10 ? "10+" : results
          }] results found!`;
        }

        await page.keyboard.press("Enter"); // Enter Key
        await page.waitForTimeout(1500);
        const res = await scrapeProperty(page);
        const returnColumn = {
          "CITY ": newCity == properties[i].CITY ? "" : properties[i].CITY,
          CITY: properties[i].CITY,
          "FOLIO NUMBER": res.propertyId ? res.propertyId : "",
          ADDRESS: res.physicalAddress ? properties[i].ADDRESS : "",
          "PROPERTY OWNER": res.propertyOwner ? res.propertyOwner : "",
          "MAILING ADDRESS": res.mailingAddress
            ? `"${res.mailingAddress}"`
            : "",
          "ZIP CODE": res.zipCode ? res.zipCode : "",
          "PROPERTY USE": res.propertyUse ? `"${res.propertyUse}"` : "",
          "AREA(SF)": res.areaSF ? res.areaSF : "",
          "YEAR BUILT": res.yearBuilt ? res.yearBuilt : "",
          "# of owners in the building":
            properties[i]["# of owners in the building"],
          "Filled by": "AUTOMATED SCRIPT",
          "ERROR WITH AUTOMATION": errorMessages,
        };
        if (newCity != properties[i].CITY) {
          console.log(
            `New city found! \x1b[46m\x1b[5m${properties[i].CITY}\x1b[0m`
          );
        }

        newCity = properties[i].CITY;
        errorMessages = "";
        await addRow(returnColumn, true);
      } else {
        noUpdateNeededCount++;
        const returnColumn = {
          "CITY ": newCity == properties[i].CITY ? "" : properties[i].CITY,
          CITY: properties[i].CITY,
          "FOLIO NUMBER": properties[i]["FOLIO NUMBER"],
          ADDRESS: properties[i]["ADDRESS"],
          "PROPERTY OWNER": `"${properties[i]["PROPERTY OWNER"]}"`,
          "MAILING ADDRESS": `"${properties[i]["MAILING ADDRESS"]}"`,

          "ZIP CODE": properties[i]["ZIP CODE"],
          "PROPERTY USE": `"${properties[i]["PROPERTY USE"]}"`,
          "AREA(SF)": properties[i]["AREA(SF)"],
          "YEAR BUILT": properties[i]["YEAR BUILT"],
          "# of owners in the building":
            properties[i]["# of owners in the building"],
          "Filled by": properties[i]["Filled by:"],
          "ERROR WITH AUTOMATION": "",
        };
        newCity = properties[i].CITY;
        await addRow(returnColumn, true);
      }

      if (i === propertiesLength - 1) {
        console.log("Scraping complete!");
      } else {
        console.log(
          `Scraped \x1b[37m\x1b[42m${
            i - noResultsFoundCount - multipleResultsFoundCount + 1
          }\x1b[0m of ${propertiesLength} \n 
  \x1b[41m${noResultsFoundCount} with no results\x1b[0m\n
  \x1b[43m${multipleResultsFoundCount} with multiple results\x1b[0m\n
  \x1b[45m${noUpdateNeededCount} with data alerdy exist\x1b[0m\n`
        );

        console.log(
          `\x1b[1m\x1b[34m\x1b[47mrunning for ${ruunigTime()}\x1b[0m`
        );
        const presentage = calculatePresentage(
          i - noResultsFoundCount - multipleResultsFoundCount + 1,
          propertiesLength
        );

        for (let i = 0; i < Math.round(presentage + 1); i++) {
          process.stdout.write("\x1b[42m \x1b[0m");
        }
        console.log(`\n\x1b[30m\x1b[47m\x1b[1m\x1b[5m${presentage}% \x1b[0m`);

        console.log("\nScraping next property...");
      }
    }

    // Program successfully completed
    await browser.close();
    console.log("Program completed!");
    cleanExit = true;
    saveFaliedinvalidAddresses(true);
    saveCSV(true);
  },
};

const scrapeProperty = async (page) => {
  const propertyId = await (
    await (await page.$("#folioNumberId")).getProperty("textContent")
  ).jsonValue();

  const propertyOwnerOne = await (
    await (await page.$("#ownerNameId")).getProperty("textContent")
  ).jsonValue();
  const propertyOwnerTwo =
    (await page.$("#ownerName2Id")) !== null
      ? await (
          await (await page.$("#ownerName2Id")).getProperty("textContent")
        ).jsonValue()
      : "";
  const propertyOwnerThree =
    (await page.$("#ownerName3Id")) !== null
      ? await (
          await (await page.$("#ownerName3Id")).getProperty("textContent")
        ).jsonValue()
      : "";
  const propertyOwnerFour =
    (await page.$("#ownerName4Id")) !== null
      ? await (
          await (await page.$("#ownerName4Id")).getProperty("textContent")
        ).jsonValue()
      : "";

  const mailingAddress = await (
    await (await page.$("#mailingAddressId")).getProperty("textContent")
  ).jsonValue();

  const fullAddress = await (
    await (await page.$("#situsAddressId")).getProperty("textContent")
  ).jsonValue();

  const zipCode = fullAddress.split(",").pop().trim();
  const physicalAddress = fullAddress.split(",").shift().trim();

  const Neighborhood = await (
    await (await page.$("#neighborhood")).getProperty("textContent")
  ).jsonValue();

  const propertyUse = await (
    await (await page.$("#useCodeId")).getProperty("textContent")
  ).jsonValue();

  const millageCode = await (
    await (await page.$("#millageCodeId")).getProperty("textContent")
  ).jsonValue();

  const areaSF = await (
    await (await page.$("#bldgSqFTId")).getProperty("textContent")
  ).jsonValue();

  const adjBldgSF_buildingId = await (
    await (await page.$("#buildingId")).getProperty("textContent")
  ).jsonValue();

  const adjBldgSF = adjBldgSF_buildingId.trim();

  const bldgUnderAirSF = await (
    await (await page.$("#bldgUnderAirFootageId")).getProperty("textContent")
  ).jsonValue();

  const effectiveYear = await (
    await (await page.$("#effectiveAgeId")).getProperty("textContent")
  ).jsonValue();

  const yearBuilt = await (
    await (await page.$("#actualAgeId")).getProperty("textContent")
  ).jsonValue();

  const unitsBedsBaths = await (
    await (await page.$("#unitsBedsBathsId")).getProperty("textContent")
  ).jsonValue();

  const [units, beds, baths] = unitsBedsBaths.replace(/\s/g, "").split("/");

  const deputyAppraiser = await (
    await (await page.$("#deputyAppraiserNameId")).getProperty("textContent")
  ).jsonValue();

  const propertyAppraiserNumber = await (
    await (await page.$("#phoneNumber")).getProperty("textContent")
  ).jsonValue();

  const propertyAppraiserEmail = await (
    await (await page.$("#email")).getProperty("textContent")
  ).jsonValue();

  let propertyOwner = `"${propertyOwnerOne}"`;
  if (propertyOwnerTwo !== "")
    propertyOwner += `"
  ${propertyOwnerTwo}"`;
  if (propertyOwnerThree !== "")
    propertyOwner += `"
  ${propertyOwnerThree}"`;
  if (propertyOwnerFour !== "")
    propertyOwner += `"
  ${propertyOwnerFour}"`;

  result = {
    propertyId,
    propertyOwner,
    physicalAddress,
    mailingAddress,
    zipCode,
    propertyUse,
    areaSF,
    yearBuilt,
  };

  return result;
};

// mailingAddress
// Neighborhood
// millageCode
// effectiveYear
// units
// beds
// baths
// deputyAppraiser
// propertyAppraiserNumber
// propertyAppraiserEmail

const initialCSV = async () => {
  await initCSV(
    {
      "CITY ": "",
      CITY: "",
      "FOLIO NUMBER": "",
      ADDRESS: "",
      "PROPERTY OWNER": "",
      "MAILING ADDRESS": "",
      "ZIP CODE": "",
      "PROPERTY USE": "",
      "AREA(SF)": "",
      "YEAR BUILT": "",
      "# of owners in the building": "",
      "Filled by:": "",
      "ERROR WITH AUTOMATION": "",
    },
    true
  );

  await initCSV(
    {
      address: "",
      multipleResults: false,
      internalError: false,
      amountOfResults: 0,
    },
    false
  );
};

const importProperties = async (csvFilePath) => {
  // Convert a csv file with csvtojson
  // csv()
  //   .fromFile(csvFilePath)
  //   .then(function (jsonArrayObj) {
  //     //when parse finished, result will be emitted here.
  //     console.log(jsonArrayObj);
  //   });

  // // Parse large csv with stream / pipe (low mem consumption)
  // csv()
  //   .fromStream(readableStream)
  //   .subscribe(function (jsonObj) {
  //     //single json object will be emitted for each csv line
  //     // parse each json asynchronousely
  //     return new Promise(function (resolve, reject) {
  //       asyncStoreToDb(json, function () {
  //         resolve();
  //       });
  //     });
  // });

  //Use async / await
  const jsonArray = await csv().fromFile(csvFilePath);
  return jsonArray;
};

function calculatePresentage(current, total) {
  return ((current / total) * 100).toFixed(2);
}

function ruunigTime() {
  var timeDiff = new Date().getTime() - startTime; //in ms
  // strip the ms
  timeDiff /= 1000;

  // get seconds
  var seconds = Math.round(timeDiff);

  seconds = Number(seconds);
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds % 3600) / 60);
  let s = Math.floor((seconds % 3600) % 60);

  let hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  let mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  let sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return hDisplay + mDisplay + sDisplay;
}

module.exports = scraperObject;

process.stdin.resume(); // so the program will not close instantly

async function exitHandler(options, exitCode) {
  if (options.cleanup) {
    if (!cleanExit) {
      saveCSV(false);
      console.log("Program not completed! exiting...");
    }
    // saveFaliedinvalidAddresses();
  }
  if (exitCode || exitCode === 0) {
    console.log(exitCode);
  }
  if (options.exit) {
    //   saveFaliedinvalidAddresses();
    if (!cleanExit) {
      saveCSV(false);
      console.log("Program not completed! exiting...");
    }
    process.exit();
  }
}
// do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

// catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

// catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));
