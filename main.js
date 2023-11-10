import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();
  await page.goto('https://trello.com/b/QvHVksDa/personal-work-goals');
  
  const [button_okay] = await page.$x("//button[contains(., 'Okay, got it')]");
  if (button_okay) {
      console.log("Okay button founded")
      await button_okay.click();
      console.log(" Okay button clicked");
    } 
    /*
// Example: Extract task titles using XPath-like selector
  const cardTitles = await page.$$eval('[data-testid^="list-header"]', (cards) => {
        return cards.map((card) => card.textContent.trim());
    });  
  */
 
  
    // Select all list headers
  const listHeaders = await page.$$('[data-testid^="list-header"]');

  const tasks = [];
  for (const listHeader of listHeaders) {
       const title = await listHeader.evaluate((el) => el.textContent.trim());
       //console.log(title);
       // Find card names within the same list
       const cardNames = await listHeader.$$('[data-testid^="card-name"]');
       const content = await Promise.all(cardNames.map((cardName) => cardName.evaluate((el) => el.textContent.trim())));

       tasks.push({ title, content });
    }   
    
  await page.screenshot({path: './test.png'}); 
  await browser.close();
  console.log('Tasks:', tasks);
  //console.log('Task titles:', cardTitles);
  console.log("Done");
  })();