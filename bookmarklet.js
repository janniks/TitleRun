const fs = require("fs");
const terser = require("terser");

try {
  const index = fs.readFileSync("public/index.html", "utf8");
  const game = fs.readFileSync("game.js", "utf8");

  const minified = terser.minify(game).code;
  const anonymous = `(function() {${minified}}());`;
  const bookmarklet = `javascript:${encodeURIComponent(anonymous)}`;
  const replaced = index.replace(/#BOOKMARKLET/g, bookmarklet);

  fs.writeFileSync("public/index.html", replaced, "utf8");
} catch (error) {
  console.error(error);
}
