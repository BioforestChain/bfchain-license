// @ts-check
/// <reference lib="dom"/>
const marked = require("marked");
const path = require("path");
const fs = require("fs");
const prettier = require("prettier");
const jsdom = require("jsdom");

marked.setOptions({
  renderer: new marked.Renderer(),
  pedantic: false,
  gfm: true,
  headerIds: false,
  //   headerPrefix: "s",
  breaks: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false,
});

const SOURCE_DIRNAME = path.join(__dirname, "../source");
const HTML_DIRNAME = path.join(__dirname, "../html");

for (const basename of fs.readdirSync(SOURCE_DIRNAME)) {
  const sourceFilename = path.join(SOURCE_DIRNAME, basename);
  const lang = basename.slice(0, -3); //replace(".md", "")
  const htmlFilename = path.join(HTML_DIRNAME, lang + ".html");
  const sourceHtml = marked(fs.readFileSync(sourceFilename, "utf-8"));
  const dom = new jsdom.JSDOM(`<!DOCTYPE html>
  <html lang="${lang}">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title></title>
      <style>
      html {
        font-family: "苹方", "San Francisco", "微软雅黑", "Microsoft YaHei";
      }
      body {
        max-width: 800px;
        max-width: min(800px, calc(100vw - 2em));
        margin: 0 auto;
        line-height: 2em;
      }
      h1 {
        text-align: center;
        margin-top: 3em;
        margin-bottom: 1em;
      }
      p {
        text-indent: 2em;
      }
      u {
        text-decoration: unset;
      }
      html[lang="en-US"] {
        text-align: justify;
      }
      html[lang="en-US"] #s5 + ol strong {
        text-transform: uppercase;
        font-weight: normal;
      }
      html[lang="en-US"] #s5-1::marker {
        text-transform: uppercase;
      }
      html[lang="en-US"] #s5-2::marker {
        text-transform: uppercase;
      }
      </style>
  </head>
  <body>
      ${sourceHtml}
  </body>
  </html>`);
  {
    const { window } = dom;
    const { document } = window;
    /**
     * @type {typeof document.querySelector}
     */
    const $ = document.querySelector.bind(document);
    /**
     * @type {typeof document.querySelectorAll}
     */
    const $$ = document.querySelectorAll.bind(document);

    /// title
    $("title").innerHTML = $("h1").textContent;
    /// h2 id
    for (const [index, h2Ele] of $$("h2").entries()) {
      h2Ele.id = `s${index + 1}`;
    }
    /// ol type
    for (const olEle of $$("body>ol")) {
      olEle.setAttribute("type", "a");
    }
    for (const olEle of $$("body>ol>li>ol")) {
      olEle.setAttribute("type", "1");
    }
    for (const olEle of $$("body>ol>li>ol>li>ol")) {
      olEle.setAttribute("type", "A");
    }
    for (const olEle of $$("body>ol>li>ol>li>ol>li>ol")) {
      olEle.setAttribute("type", "i");
    }
    // li id
    /**
     *
     * @param {HTMLOListElement} olEle
     * @param {string} prefix
     */
    const setLiId = (olEle, prefix) => {
      let i = 1;
      for (const [_, liEle] of olEle
        .querySelectorAll(":scope > li")
        .entries()) {
        /// jsdom bug
        if (liEle.parentElement !== olEle) {
          continue;
        }
        liEle.id = `${prefix}-${i++}`;
        const subOlEle = liEle.querySelector("ol");
        if (subOlEle) {
          setLiId(subOlEle, liEle.id);
        }
      }
    };
    let index = 1;
    for (const [_, rootOlEle] of $$("body>ol").entries()) {
      if (rootOlEle instanceof window.HTMLOListElement) {
        setLiId(rootOlEle, `s${index++}`);
      }
    }
  }

  const formatedHtml = prettier.format(
    dom.window.document.documentElement.outerHTML,
    {
      parser: "html",
    }
  );
  fs.writeFileSync(htmlFilename, formatedHtml);
}
