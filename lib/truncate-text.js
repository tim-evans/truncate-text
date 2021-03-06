import { splitOnSoftWrapOpportunities } from "./truncate-text/css";
import { trim } from "./truncate-text/utils";
import { getWordMetrics } from "./truncate-text/words";
import { merge } from "dom-ruler/utils";
import { getLayout, measureText } from "dom-ruler";

var truncate = function (fragment, options) {
  options = merge({
    ellipsis: '&hellip;',
    block: fragment,
    lineBreak: 'normal'
  }, options);

  var layout = getLayout(options.block);
  var width = layout.content.width;
  var metrics = getWordMetrics(fragment.innerHTML, merge({ width: width, template: fragment }, options));
  var lines = metrics.lines;

  // Compute the size of the ellipsis
  var ellipsisWidth = measureText(options.ellipsis, { template: fragment, escape: false }).width;

  var blockHTML = options.block.innerHTML;
  var fragmentHTML = fragment.outerHTML;
  blockHTML = blockHTML.slice(blockHTML.indexOf(fragmentHTML) + fragmentHTML.length);

  var blockWidth = 0;
  if (blockHTML) {
    var blockLines = getWordMetrics(blockHTML, merge({ width: layout.width, template: options.block }, options));
    var firstLine = blockLines.lines[0];
    var lastBlockToken = firstLine[firstLine.length - 1];
    blockWidth = lastBlockToken.width + lastBlockToken.left;
  }

  if (lines.length >= options.lines) {
    var noTokens = 0;
    var line;
    for (var i = 0, len = options.lines; i < len; i++) {
      line = lines[i];
      noTokens += line.length;
    }

    var tokens = metrics.words.slice(0, noTokens);
    var lastToken = line[line.length - 1];

    // Check to see if a full fragment needs to be truncated
    if (lastToken.left + lastToken.width + blockWidth <= width && options.lines === lines.length) {
      return;
    }

    while (lastToken.left + lastToken.width + ellipsisWidth + blockWidth > width) {
      tokens.pop();
      line.pop();
      lastToken = line[line.length - 1];
      if (lastToken == null) {
        break;
      }
    }
    fragment.innerHTML = trim(tokens.join('')) + options.ellipsis;
  }
};

export var truncate = truncate;
