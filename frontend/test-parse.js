const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html><div><h4 style="font-size:1.125rem;font-weight:700;text-align:center;">Test</h4></div>`);
const h4 = dom.window.document.querySelector("h4");
console.log(h4.getAttribute("style"));
