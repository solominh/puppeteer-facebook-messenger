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

const getBotReplyMessageElementHandle = async page => {
  const jsHandle = await page.evaluateHandle(selectors => {
    const lastMessage = document.querySelector(selectors.lastMessageSelector);
    const isBotMessage = lastMessage.className.contains('_ua1');
    console.log(lastMessage);
    if (isBotMessage) return lastMessage;

    return null;
  }, selectors);

  return jsHandle.asElement();
};

const getBotReplyTextMessages = async page => {
  while (true) {
    await page.waitFor(1000);
    const botMessageElementHandle = await getBotReplyMessageElementHandle(page);
    if (!botMessageElementHandle) continue;

    // Wait for another messages
    await page.waitFor(1000); 
    const textMessages = await botMessageElementHandle
      .asElement()
      .$$eval(selectors.textMessagesSelector, els => {
        console.log(els)
        return els.map(el => {
          console.log(el.parentElement.textContent, el);
          while (el.nodeType !== 3) el = el.firstChild;
          return el.parentElement.textContent;
        });
      });

    await botMessageElementHandle.dispose();

    return textMessages.map(m => m.trim()).filter(m => m);
  }
};

module.exports = {
  openChatWindow,
  sendMessage,
  getBotReplyTextMessages,
};
