const createNewFileHelper = require('./create-file');
const puppeteer = require('puppeteer-extra');
const { executablePath } = require('puppeteer');

const url =
    'https://www.tennisontario.com/clubs/get-on-the-court/find-a-club?search_by=nearest';

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--window-size=1920,1080'],
        ignoreHTTPSErrors: true,
        // add this
        executablePath: executablePath(),
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080,
    });
    await page.goto(url, {
        waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('.maincontent');
    await page.$eval('button[type=submit].btn-primary', (button) =>
        button.click()
    );
    // Get the [page list] for tennis courts in the area
    await page.waitForSelector('div.gm-style');
    // Wait for the element and its children to be fully loaded
    await page.waitForFunction(() => {
        const element = document.querySelector('div#myList');
        return element && element.children.length > 0;
    });
    const myListHandle = await page.$('div#myList');
    console.log(myListHandle.toString()); // This is the element handle

    // Get the children of the list handle
    const childrenHandles = await page.evaluateHandle(
        (element) => Array.from(element.children),
        myListHandle
    ); // This will get all direct children
    const childrenArray = await childrenHandles.getProperties();
    // Array of objects (Children)
    const childrenData = [];
    // Convert the JSHandles in to an array of element handles
    // Helper function to determine the country
    const determineCountry = (location) => {
        const canadaLocations = ['Ontario', 'Parry Sound', 'Toronto', 'Ottawa']; // Add more known Canadian locations
        const usaLocations = ['New York', 'Los Angeles', 'Chicago', 'Miami']; // Add more known USA locations

        if (canadaLocations.some((loc) => location.includes(loc))) {
            return 'Canada';
        } else if (usaLocations.some((loc) => location.includes(loc))) {
            return 'USA';
        } else {
            return 'Unknown';
        }
    };

    // Iterate over the children and extract needed data
    for (const child of childrenArray.values()) {
        const childData = await page.evaluate((el) => {
            const img = el.querySelector('img');
            const h3 = el.querySelector('h3');
            const emailElement = el.querySelector('div.mb-1 i.fa-envelope');
            const email = emailElement
                ? emailElement.parentElement.textContent.trim()
                : '';
            const addressElement = el.querySelector('div.mb-1 i.fa-map-pin');
            const address = addressElement
                ? addressElement.parentElement.textContent.trim()
                : '';
            const locationElement = el.querySelector(
                'a[href^="http://maps.google.com/maps?q="]'
            );
            const location = locationElement
                ? locationElement.href.split('?q=')[1].split('+').join(' ')
                : '';

            return {
                imgSrc: img ? img.src : '',
                title: h3 ? h3.textContent.trim() : '',
                email: email,
                address: address,
                location: location,
            };
        }, child); // Passing `child` as an argument to the page function

        // Determine the country and add it to the childData object
        childData.country = determineCountry(childData.location);

        childrenData.push(childData);
    }
    // Create a new file with format using the helper method.
    createNewFileHelper(childrenData, 'json');
})();
