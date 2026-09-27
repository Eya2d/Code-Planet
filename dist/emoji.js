(() => {
  const emojiPattern = /(?:[0-9#*]\uFE0F?\u20E3|\p{Regional_Indicator}{2}|\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?\p{Emoji_Modifier}?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?\p{Emoji_Modifier}?)*)/gu;
  const ignoredParents = 'script, style, textarea, code, pre, iframe, option, [contenteditable="true"], [data-no-emoji]';

  function assetName(emoji) {
    const points = Array.from(emoji, character => character.codePointAt(0).toString(16));
    return points.filter((point, index) => point !== 'fe0f' || points[index + 1] === '20e3').join('-');
  }

  function createImage(emoji) {
    const image = document.createElement('img');
    image.className = 'emoji-img';
    image.src = `assets/emojis/${assetName(emoji)}.svg`;
    image.alt = emoji;
    image.draggable = false;
    image.decoding = 'async';
    image.addEventListener('error', () => {
      const fallback = document.createElement('span');
      fallback.dataset.noEmoji = '';
      fallback.textContent = emoji;
      image.replaceWith(fallback);
    }, {once:true});
    return image;
  }

  function replaceTextNode(node) {
    if (!node.nodeValue || !node.parentElement || node.parentElement.closest(ignoredParents)) return;
    emojiPattern.lastIndex = 0;
    const matches = Array.from(node.nodeValue.matchAll(emojiPattern));
    if (!matches.length) return;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    matches.forEach(match => {
      if (match.index > cursor) fragment.append(node.nodeValue.slice(cursor, match.index));
      fragment.append(createImage(match[0]));
      cursor = match.index + match[0].length;
    });
    if (cursor < node.nodeValue.length) fragment.append(node.nodeValue.slice(cursor));
    node.replaceWith(fragment);
  }

  function replaceEmojis(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      replaceTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || root.matches(ignoredParents)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(replaceTextNode);
  }

  replaceEmojis(document.body);
  new MutationObserver(mutations => {
    mutations.forEach(mutation => mutation.addedNodes.forEach(replaceEmojis));
  }).observe(document.body, {childList:true, subtree:true});
})();
