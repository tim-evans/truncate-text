define("truncate-text", 
  ["truncate-text/css","truncate-text/utils","truncate-text/words","dom-ruler/utils","dom-ruler","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var splitOnSoftWrapOpportunities = __dependency1__.splitOnSoftWrapOpportunities;
    var trim = __dependency2__.trim;
    var getWordMetrics = __dependency3__.getWordMetrics;
    var merge = __dependency4__.merge;
    var getLayout = __dependency5__.getLayout;
    var measureText = __dependency5__.measureText;

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

    var truncate = truncate;
    __exports__.truncate = truncate;
  });
;define("truncate-text/css", 
  ["truncate-text/utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    // LineBreak-7.0.0.txt
    // Date: 2014-02-28, 23:15:00 GMT [KW, LI]
    var trim = __dependency1__.trim;

    var STRICT_BREAK_RE = /[\t \-\xA0\u034F\u035C-\u0362\u0F08\u0F0C\u0F12\u0FD9\u0FDA\u180E\u2007\u200B\u2011\u202F\u2060\uFEFF]/;
    var NORMAL_BREAK_RE = /[\t \-\xA0\u034F\u035C-\u0362\u0F08\u0F0C\u0F12\u0FD9\u0FDA\u180E\u2007\u200B\u2011\u202F\u2060\u3041\u3043\u3045\u3047\u3049\u3063\u3083\u3085\u3087\u308E\u3095\u3096\u30A1\u30A3\u30A5\u30A7\u30A9\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6\u30FC\u31F0-\u31FF\uFEFF\uFF67-\uFF70]/;
    var CJK_NORMAL_BREAK_RE = /[\t \-\xA0\u034F\u035C-\u0362\u0F08\u0F0C\u0F12\u0FD9\u0FDA\u180E\u2007\u200B\u2010\u2011\u2013\u202F\u2060\u301C\u3041\u3043\u3045\u3047\u3049\u3063\u3083\u3085\u3087\u308E\u3095\u3096\u30A0\u30A1\u30A3\u30A5\u30A7\u30A9\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6\u30FC\u31F0-\u31FF\uFEFF\uFF67-\uFF70]/;
    var LOOSE_BREAK_RE = /[\t \-\xA0\u034F\u035C-\u0362\u0F08\u0F0C\u0F12\u0FD9\u0FDA\u180E\u2007\u200B\u2011\u202F\u2060\u3005\u303B\u3041\u3043\u3045\u3047\u3049\u3063\u3083\u3085\u3087\u308E\u3095\u3096\u309D\u309E\u30A1\u30A3\u30A5\u30A7\u30A9\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6\u30FC-\u30FE\u31F0-\u31FF\uFEFF\uFF67-\uFF70]/;
    var CJK_LOOSE_BREAK_RE = /[\t !%\-:;\?\xA0\xA2\xB0\u034F\u035C-\u0362\u0F08\u0F0C\u0F12\u0FD9\u0FDA\u180E\u2007\u200B\u2010\u2011\u2013\u202F\u2030\u2032\u2033\u203C\u2047-\u2049\u2060\u2103\u2116\u3005\u301C\u303B\u3041\u3043\u3045\u3047\u3049\u3063\u3083\u3085\u3087\u308E\u3095\u3096\u309D\u309E\u30A0\u30A1\u30A3\u30A5\u30A7\u30A9\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6\u30FB-\u30FE\u31F0-\u31FF\uFEFF\uFF01\uFF05\uFF1A\uFF1B\uFF1F\uFF65\uFF67-\uFF70\uFFE0]/;

    var splitOnSoftWrapOpportunities = function (string, options) {
      var isChinese = options.lang === 'zh';
      var isJapanese = options.lang === 'ja';
      var regex;

      switch (options.lineBreak) {
      case 'strict':
        regex = STRICT_BREAK_RE;
      case 'normal':
        if (isChinese || isJapanese) {
          regex = CJK_NORMAL_BREAK_RE;
        } else {
          regex = NORMAL_BREAK_RE;
        }
        break;
      case 'loose':
        if (isChinese || isJapanese) {
          regex = CJK_LOOSE_BREAK_RE;
        } else {
          regex = LOOSE_BREAK_RE;
        }
        break;
      }

      string = trim(string);
      var tokens = [];
      while (string.length) {
        var index = string.search(regex);
        if (index > -1) {
          tokens.push(string.slice(0, index + 1));
          string = string.slice(index + 1);
        } else {
          tokens.push(string);
          string = '';
        }
      }

      return tokens;
    }

    __exports__.splitOnSoftWrapOpportunities = splitOnSoftWrapOpportunities;
  });
;define("truncate-text/utils", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var trim = function (string) {
      if (typeof String.prototype.trim !== 'function') {
        return string.replace(/^\s+|\s+$/g, '');
      } else {
        return string.trim();
      }
    };

    __exports__.trim = trim;
  });
;define("truncate-text/words", 
  ["truncate-text/css","dom-ruler/text","dom-ruler","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var splitOnSoftWrapOpportunities = __dependency1__.splitOnSoftWrapOpportunities;
    var prepareTextMeasurement = __dependency2__.prepareTextMeasurement;
    var setText = __dependency2__.setText;
    var teardownTextMeasurement = __dependency2__.teardownTextMeasurement;
    var getLayout = __dependency3__.getLayout;

    function getWordMetrics (string, options) {
      // Split the text where the line may break
      var text = splitOnSoftWrapOpportunities(string, { lineBreak: options.lineBreak, lang: options.lang });
      var html = [];
      for (var i = 0, len = text.length; i < len; i++) {
        html[i] = '<span>' + text[i] + '</span>';
      }

      // Prepare the test element
      var element = prepareTextMeasurement(options.template, { width: options.width + 'px' });

      // Compute the location of each <span>, resulting in line metrics
      setText(html.join(''), false);

      var lines = [];
      var parentLayout = getLayout(element).padding;
      var words = element.getElementsByTagName('span');
      var layout;
      var word;
      var lastWord;
      var line = [];

      for (i = 0, len = words.length; i < len; i++) {
        word = words[i];
        layout = getLayout(word);
        word = {
          top: word.offsetTop - parentLayout.top,
          left: word.offsetLeft - parentLayout.left,
          width: layout.width,
          height: layout.height
        };

        if (lastWord == null || word.top === lastWord.top) {
          line.push(word);
        } else {
          lines.push(line);
          line = [word];
        }
        lastWord = word;
      }

      if (line.length) {
        lines.push(line);
      }

      // Teardown the test element
      teardownTextMeasurement();

      return {
        words: text,
        lines: lines
      };
    };

    __exports__.getWordMetrics = getWordMetrics;
  });