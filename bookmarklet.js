const fs = require("fs");
const terser = require("terser");

(async function () {
  try {
    const index = fs.readFileSync("index.html", "utf8");
    const game = fs.readFileSync("game.js", "utf8");

    const minified = terser.minify(game).code;
    const anonymous = `(function() {${minified}}());`;
    const bookmarklet = `javascript:${encodeURIComponent(anonymous)}`;
    const replaced = index.replace(/#BOOKMARKLET/g, bookmarklet);

    fs.writeFileSync("index.html", replaced, "utf8");
  } catch (error) {
    console.error(error);
  }
})();
