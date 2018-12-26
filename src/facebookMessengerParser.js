const selectors = {
  allMessagesSelector:
    '.fbNubFlyoutOuter  .fbNubFlyoutInner  ._1i6a  ._4po5  ._4po8  ._4po9  div._4tdt',
  userMessagesSelector:
    '.fbNubFlyoutOuter  .fbNubFlyoutInner  ._1i6a  ._4po5  ._4po8  ._4po9  div._4tdt._ua0',
  botMessagesSelector:
    '.fbNubFlyoutOuter  .fbNubFlyoutInner  ._1i6a  ._4po5  ._4po8  ._4po9  div._4tdt._ua1',
  lastMessageSelector:
    '.fbNubFlyoutOuter  .fbNubFlyoutInner  ._1i6a  ._4po5  ._4po8  ._4po9  div._4tdt:last-child',
  textMessagesSelector: '._4gx_ ._1aa6 ._5yl5',
  sendMessageButtonSelector: "._4bl9 button[type='submit']",
  quickReplyButtonsSelector:
    ".fbNubFlyoutOuter  .fbNubFlyoutInner  ._1i6a  ._4po5  ._4po8  ._4po9 ._419m ._2zgz div[role='button'] ._10-c",
  menuButtonsSelector: '._3cn0 ._4id8 ._3cnr div a',
  slideItemsSelector: '._2dyr ._2zgz',
};

const openChatWindow = async page => {
  const sendMessageButton = await page.$(selectors.sendMessageButtonSelector);
  await sendMessageButton.click();
  await page.waitForSelector(selectors.allMessagesSelector);
};

const sendMessage = async (page, message) => {
  await openChatWindow(page);
  await page.keyboard.type(message);
  await page.keyboard.press('Enter');
};

const getBotReplyMessageHandle = async page => {
  const jsHandle = await page.evaluateHandle(selectors => {
    const lastMessage = document.querySelector(selectors.lastMessageSelector);
    const isBotMessage = lastMessage.className.contains('_ua1');
    console.log(lastMessage);
    if (isBotMessage) return lastMessage;

    return null;
  }, selectors);

  return jsHandle.asElement();
};

const getBotMessages = async page => {
  while (true) {
    await page.waitFor(1000);
    const botMessageHandle = await getBotReplyMessageHandle(page);
    if (!botMessageHandle) continue;

    // Wait for another messages
    await page.waitFor(1000);

    let textMessages = await page.evaluate(
      (botMessageEl, selectors) => {
        const textMessages = Array.from(
          botMessageEl.querySelectorAll(selectors.textMessagesSelector)
        ).map(el => {
          console.log(el.parentElement.textContent, el);
          while (el.nodeType !== 3) el = el.firstChild;
          return el.parentElement.textContent;
        });

        return textMessages;
      },
      botMessageHandle,
      selectors
    );
    textMessages = textMessages.map(m => m.trim()).filter(m => m);

    const botMessageElHandle = await botMessageHandle.asElement();
    // Note: quickReplyButtons is outside of botMessages container
    const quickReplyButtons = await page.$$(
      selectors.quickReplyButtonsSelector
    );
    const menuButtons = await botMessageElHandle.$$(
      selectors.menuButtonsSelector
    );
    const slideItems = await botMessageElHandle.$$(
      selectors.slideItemsSelector
    );

    await botMessageHandle.dispose();

    return {
      textMessages,
      quickReplyButtons,
      menuButtons,
      slideItems,
    };
  }
};

module.exports = {
  openChatWindow,
  sendMessage,
  getBotMessages,
};
