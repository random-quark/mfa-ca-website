const markdownIt = require("markdown-it");

module.exports = function(eleventyConfig) {
  // Copy CSS files
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/assets");
  
  // Configure markdown-it with table support
  let markdownItOptions = {
    html: true,
    breaks: false,
    linkify: true
  };
  
  eleventyConfig.setLibrary("md", markdownIt(markdownItOptions));
  
  return {
    dir: {
      input: "src",
      output: "_site"
    },
    pathPrefix: "/mfa-ca-website/",
    markdownTemplateEngine: "njk"
  };
}; 