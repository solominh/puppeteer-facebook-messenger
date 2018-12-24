const selectors = {
  allMessagesSelector:
    '.fbNubFlyoutOuter  .fbNubFlyoutInner  ._1i6a  ._4po5  ._4po8  ._4po9  div._4tdt',
  lastMessageSelector:
    '.fbNubFlyoutOuter  .fbNubFlyoutInner  ._1i6a  ._4po5  ._4po8  ._4po9  div._4tdt:last-child',
  textMessagesSelector: 'div._4gx_ div._1aa6 span._5yl5',
};

const openChatWindow = async page => {
  await page.$$eval('button[type="submit"]', buttons => {
    const results = Array.from(buttons).filter(
      b => b.textContent === 'Send Message'
    );
    results[0].click();
  });

  await page.waitForSelector(selectors.allMessagesSelector);
};

const sendMessage = async (page, message) => {
  await openChatWindow(page);
  await page.keyboard.type(message);
  await page.keyboard.press('Enter');
};

const getBotReplyMessage = async page => {
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
    const botMessage = await getBotReplyMessage(page);
    if (!botMessage) continue;

    const textMessages = await botMessage.$$eval(
      selectors.textMessagesSelector,
      els =>
        els.map(el => {
          while (el.nodeType !== 3) el = el.firstChild;
          return el.parentElement.textContent;
        })
    );

    return textMessages;
  }
};

module.exports = {
  sendMessage,
  getBotReplyTextMessages,
};
