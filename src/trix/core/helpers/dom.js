/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import config from "trix/config";
import { ZERO_WIDTH_SPACE } from "trix/constants";
import { extend } from "./extend";
import { attachmentSelector } from "trix/config/attachments";

const html = document.documentElement;
const match = html.matches;

export var handleEvent = function(eventName, {onElement, matchingSelector, withCallback, inPhase, preventDefault, times} = {}) {
  const element = onElement != null ? onElement : html;
  const selector = matchingSelector;
  const callback = withCallback;
  const useCapture = inPhase === "capturing";

  var handler = function(event) {
    if ((times != null) && (--times === 0)) { handler.destroy(); }
    const target = findClosestElementFromNode(event.target, {matchingSelector: selector});
    if (target != null) {
      withCallback?.call(target, event, target);
      if (preventDefault) { return event.preventDefault(); }
    }
  };

  handler.destroy = () => element.removeEventListener(eventName, handler, useCapture);

  element.addEventListener(eventName, handler, useCapture);
  return handler;
};

export var handleEventOnce = function(eventName, options = {}) {
  options.times = 1;
  return handleEvent(eventName, options);
};

export var triggerEvent = function(eventName, {onElement, bubbles, cancelable, attributes} = {}) {
  const element = onElement != null ? onElement : html;
  bubbles = bubbles !== false;
  cancelable = cancelable !== false;

  const event = document.createEvent("Events");
  event.initEvent(eventName, bubbles, cancelable);
  if (attributes != null) { extend.call(event, attributes); }
  return element.dispatchEvent(event);
};

export var elementMatchesSelector = function(element, selector) {
  if (element?.nodeType === 1) {
    return match.call(element, selector);
  }
};

export var findClosestElementFromNode = function(node, {matchingSelector, untilNode} = {}) {
  while (!(node == null) && (node.nodeType !== Node.ELEMENT_NODE)) { node = node.parentNode; }
  if (node == null) { return; }

  if (matchingSelector != null) {
    if (node.closest && (untilNode == null)) {
      return node.closest(matchingSelector);
    } else {
      while (node && (node !== untilNode)) {
        if (elementMatchesSelector(node, matchingSelector)) { return node; }
        node = node.parentNode;
      }
    }
  } else {
    return node;
  }
};

export var findInnerElement = function(element) {
  while (element?.firstElementChild) { element = element.firstElementChild; }
  return element;
};

export var innerElementIsActive = element => (document.activeElement !== element) && elementContainsNode(element, document.activeElement);

export var elementContainsNode = function(element, node) {
  if (!element || !node) { return; }
  while (node) {
    if (node === element) { return true; }
    node = node.parentNode;
  }
};

export var findNodeFromContainerAndOffset = function(container, offset) {
  if (!container) { return; }
  if (container.nodeType === Node.TEXT_NODE) {
    return container;
  } else if (offset === 0) {
    return container.firstChild != null ? container.firstChild : container;
  } else {
    return container.childNodes.item(offset - 1);
  }
};

export var findElementFromContainerAndOffset = function(container, offset) {
  const node = findNodeFromContainerAndOffset(container, offset);
  return findClosestElementFromNode(node);
};

export var findChildIndexOfNode = function(node) {
  if (!node?.parentNode) { return; }
  let childIndex = 0;
  while ((node = node.previousSibling)) { childIndex++; }
  return childIndex;
};

export var removeNode = node => node?.parentNode?.removeChild(node);

export var walkTree = function(tree, {onlyNodesOfType, usingFilter, expandEntityReferences} = {}) {
  const whatToShow = (() => { switch (onlyNodesOfType) {
    case "element": return NodeFilter.SHOW_ELEMENT;
    case "text":    return NodeFilter.SHOW_TEXT;
    case "comment": return NodeFilter.SHOW_COMMENT;
    default: return NodeFilter.SHOW_ALL;
  } })();

  return document.createTreeWalker(tree, whatToShow, usingFilter != null ? usingFilter : null, expandEntityReferences === true);
};

export var tagName = element => element?.tagName?.toLowerCase();

export var makeElement = function(tag, options = {}) {
  let key, value;
  if (typeof tag === "object") {
    options = tag;
    tag = options.tagName;
  } else {
    options = {attributes: options};
  }

  const element = document.createElement(tag);

  if (options.editable != null) {
    if (options.attributes == null) { options.attributes = {}; }
    options.attributes.contenteditable = options.editable;
  }

  if (options.attributes) {
    for (key in options.attributes) {
      value = options.attributes[key];
      element.setAttribute(key, value);
    }
  }

  if (options.style) {
    for (key in options.style) {
      value = options.style[key];
      element.style[key] = value;
    }
  }

  if (options.data) {
    for (key in options.data) {
      value = options.data[key];
      element.dataset[key] = value;
    }
  }

  if (options.className) {
    for (let className of Array.from(options.className.split(" "))) {
      element.classList.add(className);
    }
  }

  if (options.textContent) {
    element.textContent = options.textContent;
  }

  if (options.childNodes) {
    for (let childNode of Array.from([].concat(options.childNodes))) {
      element.appendChild(childNode);
    }
  }

  return element;
};

let blockTagNames = undefined;

export var getBlockTagNames = function() {
  if (blockTagNames != null) { return blockTagNames; }

  blockTagNames = [];
  for (let key in config.blockAttributes) {
    const attributes = config.blockAttributes[key];
    if (attributes.tagName) { blockTagNames.push(attributes.tagName); }
  }

  return blockTagNames;
};

export var nodeIsBlockContainer = node => nodeIsBlockStartComment(node?.firstChild);

export var nodeProbablyIsBlockContainer = function(node) {
  let needle, needle1;
  return (needle = tagName(node), Array.from(getBlockTagNames()).includes(needle)) &&
    (needle1 = tagName(node.firstChild), !Array.from(getBlockTagNames()).includes(needle1));
};

export var nodeIsBlockStart = function(node, {strict} = {strict: true}) {
  if (strict) {
    return nodeIsBlockStartComment(node);
  } else {
    return nodeIsBlockStartComment(node) ||
      (!nodeIsBlockStartComment(node.firstChild) && nodeProbablyIsBlockContainer(node));
  }
};

export var nodeIsBlockStartComment = node => nodeIsCommentNode(node) && (node?.data === "block");

export var nodeIsCommentNode = node => node?.nodeType === Node.COMMENT_NODE;

export var nodeIsCursorTarget = function(node, {name} = {}) {
  if (!node) { return; }
  if (nodeIsTextNode(node)) {
    if (node.data === ZERO_WIDTH_SPACE) {
      if (name) {
        return node.parentNode.dataset.trixCursorTarget === name;
      } else {
        return true;
      }
    }
  } else {
    return nodeIsCursorTarget(node.firstChild);
  }
};

export var nodeIsAttachmentElement = node => elementMatchesSelector(node, attachmentSelector);

export var nodeIsEmptyTextNode = node => nodeIsTextNode(node) && (node?.data === "");

export var nodeIsTextNode = node => node?.nodeType === Node.TEXT_NODE;
