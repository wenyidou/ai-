(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./Readability"));
  } else {
    root.ReaderAbility = factory(root.Readability);
  }
})(typeof self !== "undefined" ? self : this, function (Readability) {
  "use strict";

  if (!Readability) {
    throw new Error("Readability dependency not found. Make sure Readability.js is loaded first.");
  }

  /* =============================================================================
   * 核心辅助方法
   * =============================================================================
   */

  /**
   * 深度克隆传入的 Document，避免 Readability 直接篡改原页面。
   * Readability 在解析过程中会修改 DOM，所以需要拷贝一份干净的数据。
   * @param {Document} doc
   * @returns {Document}
   */
  function cloneDocument(doc) {
    if (!doc || !doc.documentElement) {
      throw new Error("A valid Document must be provided.");
    }
    return doc.cloneNode(true);
  }

  /**
   * 根据提取出的正文 HTML 创建一个轻量的文档对象。
   * 该文档只用于后续处理（例如遍历图片），不影响原始页面结构。
   * @param {Document} sourceDoc
   * @param {string} html
   * @returns {Document}
   */
  function createContentDocument(sourceDoc, html) {
    var workingDoc = null;

    if (sourceDoc && sourceDoc.implementation && sourceDoc.implementation.createHTMLDocument) {
      workingDoc = sourceDoc.implementation.createHTMLDocument("");
    } else if (typeof document !== "undefined" && document.implementation) {
      workingDoc = document.implementation.createHTMLDocument("");
    }

    if (!workingDoc) {
      if (typeof DOMParser === "undefined") {
        throw new Error("Cannot create an HTML document for post-processing.");
      }
      workingDoc = new DOMParser().parseFromString("<!doctype html><html><body></body></html>", "text/html");
    }

    workingDoc.body.innerHTML = html || "";
    return workingDoc;
  }

  /**
   * Find a caption near the supplied image node.
   * @param {HTMLElement} img
   * @returns {string}
   */
  function findCaption(img) {
    var node = img;
    while (node) {
      if (node.tagName === "FIGURE") {
        var caption = node.querySelector("figcaption");
        if (caption) {
          return caption.textContent.trim();
        }
        break;
      }
      node = node.parentElement;
    }
    return "";
  }

  /* =============================================================================
   * 正文内容提取辅助
   * =============================================================================
   */

  /**
   * 收集正文中所有图片的元数据。
   * 生成包含 src、替换文字、标题、尺寸、说明等字段的数组，并使用 src/currentSrc 去重。
   * @param {Document} contentDoc
   * @returns {Array<{src: string, alt: string, title: string, width: number|null, height: number|null, caption: string}>}
   */
  function extractImages(contentDoc) {
    var images = [];
    var seen = Object.create(null);
    var nodes = contentDoc.querySelectorAll("img");

    nodes.forEach(function (img) {
      var src = img.currentSrc || img.getAttribute("src") || "";
      if (!src || seen[src]) {
        return;
      }

      seen[src] = true;

      var width = img.getAttribute("width");
      var height = img.getAttribute("height");

      images.push({
        src: src,
        alt: img.getAttribute("alt") || "",
        title: img.getAttribute("title") || "",
        width: width ? parseInt(width, 10) || null : null,
        height: height ? parseInt(height, 10) || null : null,
        caption: findCaption(img)
      });
    });

    return images;
  }

  /* =============================================================================
   * 对外暴露的 API
   * =============================================================================
   */

  /**
   * 针对一个 DOM Document 执行 Readability 流程：
   * 1) 克隆原始文档；2) 使用 Readability 提取正文；3) 基于提取的 HTML
   *    构建临时文档；4) 提取图片信息并返回富含元数据的结果。
   * @param {Document} doc
   * @param {Object} [options]
   * @returns {Object|null}
   */
  function extractFromDocument(doc, options) {
    var workingDoc = cloneDocument(doc);
    var reader = new Readability(workingDoc, options || {});
    var article = reader.parse();

    if (!article) {
      return null;
    }

    var contentDoc = createContentDocument(doc, article.content);
    var images = extractImages(contentDoc);

    // 添加加粗处理(不行)
    // var paragraphs = contentDoc.querySelectorAll('p');
    // console.log(paragraphs);
    // paragraphs.forEach(paragraph => {
    //     var text = paragraph.textContent.trim();
    //     console.log(text);
        
    //     // 匹配开头带数字和顿号的模式，如 "1、时间佛南"
    //     const pattern = /^\d+.\S+/;
        
    //     if (pattern.test(text)) {
    //         // 找到匹配的行，进行加粗处理
    //         // var strong = contentDoc.createElement('strong');
    //         // strong.textContent = text;
    //         // paragraph.innerHTML = ''; // 清空原内容
    //         paragraph.appendChild(strong);
            
    //         console.log('找到并加粗了开头行:', text);
    //     }
    // });

    return {
      title: article.title,
      byline: article.byline,
      dir: article.dir,
      siteName: article.siteName,
      length: article.length,
      excerpt: article.excerpt,
      textContent: article.textContent,
      content: article.content,
      images: images,
      leadImage: images.length ? images[0] : null
    };
  }

  /**
   * 辅助方法：基于原始 HTML 字符串构建 DOM 并执行提取。
   * 适用于只有纯 HTML 字符串的环境（如 Node + JSDOM），需要 DOMParser 支持。
   * @param {string} html
   * @param {Object} [options]
   * @returns {Object|null}
   */
  function extractFromHTML(html, options) {

    if (typeof DOMParser === "undefined") {
      throw new Error("DOMParser is not available in this environment.");
    }
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, "text/html");
    return extractFromDocument(doc, options);
  }

  return {
    extractFromDocument: extractFromDocument,
    extractFromHTML: extractFromHTML
  };
});

