// Purpose: Scrape data from Broward County Property Appraiser
const { saveCSV, initCSV, addRow } = require("./csvMaker");
const inputAdresses = [
  "address"
];

let csvContent = "data:text/csv;charset=utf-8,";

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
    await initCSV({
      propertyId: "",
      propertyOwnerOne: "",
      propertyOwnerTwo: "",
      propertyOwnerThree: "",
      propertyOwnerFour: "",
      physicalAddress: "",
      zipCode: "",
      propertyUse: "",
      areaSF: "",
      adjBldgSF: "",
      yearBuilt: "",
    });

    for (let i = 0; i < inputAdresses.length; i++) {
      await page.goto(this.url);
      await page.waitForTimeout(3000);
      await page.waitForSelector("#txtField");
      await page.type("#txtField", inputAdresses[i]);
      await page.keyboard.press("Enter"); // Enter Key
      await page.waitForTimeout(3000);
      const res = await scrapeProperty(page);
      console.log(res);
      await addRow(res);
      if (i === inputAdresses.length - 1) {
        console.log("Scraping complete!");
      } else {
        console.log(
          `Scraped ${i + 1} of ${inputAdresses.length} properties...`
        );
        console.log("Scraping next property...");
      }
    }
    //Program successfully completed
    await browser.close();
    console.log("Program completed!");
    await saveCSV();
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

  result = {
    propertyId,
    propertyOwnerOne: propertyOwnerOne.replace(",", ";"),
    propertyOwnerTwo: propertyOwnerTwo.replace(",", ";"),
    propertyOwnerThree: propertyOwnerThree.replace(",", ";"),
    propertyOwnerFour: propertyOwnerFour.replace(",", ";"),
    physicalAddress,
    zipCode,
    propertyUse,
    areaSF,
    yearBuilt,
  };

  return result;
};

module.exports = scraperObject;
