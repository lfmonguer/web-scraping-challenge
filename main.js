const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  // Part 1: Get tasks from Trello
  const trelloBrowser = await puppeteer.launch({
    headless: "true",
  });
  const trelloPage = await trelloBrowser.newPage();
  await trelloPage.goto('https://trello.com/b/QvHVksDa/personal-work-goals');

  const [buttonOkay] = await trelloPage.$x("//button[contains(., 'Okay, got it')]");
  if (buttonOkay) {
    await buttonOkay.click();
  }

  const trelloTasks = await trelloPage.evaluate(() => {
    const listHeaders = document.querySelectorAll('[data-testid^="list-header"]');
    const tasks = [];

    for (let i = 0; i < listHeaders.length; i++) {
      const listHeader = listHeaders[i];
      const title = listHeader.textContent.trim();

      const cardNames = listHeader.parentElement.querySelectorAll('[data-testid^="card-name"]');
      const content = Array.from(cardNames).map((cardName) => cardName.textContent.trim());

      tasks.push({ title, content });
    }

    return tasks;
  });

  // Randomly select one line from content for each of the 5 tasks
  const selectedTasks = [];
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * trelloTasks.length);
    const randomTask = {
      title: trelloTasks[randomIndex].title,
      content: [trelloTasks[randomIndex].content[Math.floor(Math.random() * trelloTasks[randomIndex].content.length)]],
    };
    selectedTasks.push(randomTask);
    trelloTasks.splice(randomIndex, 1); // Remove the selected task to avoid duplicates
  }

  // Only for debug
  //console.log('Selected Tasks:', selectedTasks);

  // Save selected tasks to a JSON file
  const jsonSelectedTasks = JSON.stringify(selectedTasks, null, 2);
  fs.writeFileSync('selectedTasks.json', jsonSelectedTasks, 'utf-8');

  // Close Trello browser
  await trelloBrowser.close();

  // Part 2: Login to Todoist
  const todoistBrowser = await puppeteer.launch({
    headless: "true",
  });
  const todoistPage = await todoistBrowser.newPage();
  await todoistPage.setViewport({ width: 1200, height: 800 });

  // Navigate to Todoist
  await todoistPage.goto('https://todoist.com/auth/login');

  // Find and fill the email input field
  const emailInputSelector = 'input[placeholder="Enter your email..."]';
  await todoistPage.waitForSelector(emailInputSelector);

  // Only for debug
  //await todoistPage.screenshot({ path: './1-Login_loadedPage.png' });

  const userEmail = 'root.lfmonguer@gmail.com';
  await todoistPage.type(emailInputSelector, userEmail);

  // Find and fill the password input field
  const passwordInputSelector = 'input[placeholder="Enter your password..."]';
  const userPassword = 'devChallenge1';
  await todoistPage.type(passwordInputSelector, userPassword);

  // Only for debug
 // await todoistPage.screenshot({ path: './2-Login_filled.png' });

  // You can also submit the form if needed
  await todoistPage.keyboard.press('Enter');

  // Wait for navigation
  await todoistPage.waitForNavigation();

  // Wait until the button is visible
  const buttonSelector = '#quick_find';
  await todoistPage.waitForSelector(buttonSelector, { visible: true });

  // Only for debug
  //await todoistPage.screenshot({ path: './3-Login_success.png' });
  const promise = new Promise(resolve => setTimeout(resolve, 1500));
  // Execute the logic for adding tasks from Trello
  const addTaskFromTrello = async (page, taskContent) => {
    
    await page.evaluate((taskContent) => {
      // Find the button using its class name
      const addButton = document.querySelector('.plus_add_button');
      if (addButton) {
        addButton.click();
      } else {
        console.error('Button not found');
      }

      // Find the contenteditable div based on your structure
      const contentEditableSelector = 'div[aria-label="Task name"]';
      const contentEditableElement = document.querySelector(contentEditableSelector);

      // Click on the contenteditable element to focus it
      contentEditableElement.click();

      // Type the task content from Trello
      contentEditableElement.textContent = taskContent;

      // Wait for the button to be visible
      const submitButtonSelector = 'button[data-testid="task-editor-submit-button"]';
      const submitButton = document.querySelector(submitButtonSelector);
      
      if (submitButton) {
        submitButton.click();
      } else {
        console.error('Submit button not found');
      }
    }, taskContent);

    // Only for debug
   // await page.screenshot({ path: `./${taskContent.replace(/\s/g, '-')}-AddButton_success.png` });
  };
  
  // Add tasks from Trello
  for (const task of selectedTasks) {
    await addTaskFromTrello(todoistPage, task.content[0]);
    await promise;
    for (const task of selectedTasks) {
      await addTaskFromTrello(todoistPage, task.content[0]);
      await promise;      
    }    
  }

  // Close the Todoist browser
  await todoistBrowser.close();
})();

