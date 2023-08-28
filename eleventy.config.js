const { EleventyRenderPlugin } = require("@11ty/eleventy");
const sass = require("sass");
const path = require("node:path");
const browserslist = require("browserslist");
const { transform, browserslistToTargets } = require("lightningcss");
const yaml = require("js-yaml");
require("dotenv").config();

const glob = require("fast-glob"),
   hljs = require("highlight.js"),
   projectName = process.env.npm_package_name,
   theme = process.env.npm_package_config_theme;

module.exports = (eleventyConfig) => {
   // Merge data instead of overriding
   eleventyConfig.setDataDeepMerge(true);

   // To Support .yaml Extension in _data
   // You may remove this if you can use JSON
   eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));

   eleventyConfig.addPlugin(EleventyRenderPlugin);

   // Engine: Markdown & plugins
   const Markdown = require("markdown-it")({
      html: true, // Enable HTML tags in source
      breaks: true, // Convert '\n' in paragraphs into <br>
      linkify: true, // Autoconvert URL-like text to links
      typographer: true, // Enable some language-neutral replacement + quotes beautification
      // quotes: ['«\xA0', '\xA0»', '‹\xA0', '\xA0›']
      highlight: function (str, lang) {
         if (lang && hljs.getLanguage(lang)) {
            try {
               return (
                  '<pre class="hljs"><code>' +
                  hljs.highlight(str, { language: lang, ignoreIllegals: true })
                     .value +
                  "</code></pre>"
               );
            } catch (e) {}
         }

         return "";
      },
   })
      .use(require("markdown-it-emoji/light"))
      .use(require("markdown-it-link-attributes"), {
         pattern: /^(https?:)?\/\//,
         attrs: {
            target: "_blank",
            rel: "noopener",
         },
      })
      .use(require("markdown-it-attrs"), {
         allowedAttributes: ["id", "class"],
      })
      .use(require("markdown-it-eleventy-img"), {
         imgOptions: {
            widths: [720, 1080, 1440, 1800],
            urlPath: "/images/",
            outputDir: "./dist/images",
         },
         globalAttributes: {
            loading: "lazy",
            sizes: "(min-width: 1340px) 720px, (min-width: 1040px) calc(85.71vw - 411px), (min-width: 940px) calc(100vw - 480px), (min-width: 780px) calc(100vw - 384px), calc(98.26vw - 27px)",
         },
         resolvePath(src, env) {
            return env.page.inputPath
               .split("/")
               .slice(0, -1)
               .concat(src)
               .join("/");
         },
      });
   eleventyConfig.setLibrary("md", Markdown);

   // Engine: Nunjucks
   eleventyConfig.setNunjucksEnvironmentOptions({
      trimBlocks: true,
      lstripBlocks: true,
   });

   // Filters
   glob.sync("./_filters/*.js").forEach((file) => {
      let filters = require("./" + file);
      Object.keys(filters).forEach((name) =>
         eleventyConfig.addFilter(name, filters[name])
      );
   });

   // Shortcodes
   glob.sync("./_shortcodes/*.js").forEach((file) => {
      let shortcodes = require("./" + file);
      Object.keys(shortcodes).forEach((name) =>
         eleventyConfig.addShortcode(name, shortcodes[name])
      );
   });

   // PairedShortcodes
   glob.sync("./_pairedShortcodes/*.js").forEach((file) => {
      let pairedShortcodes = require("./" + file);
      Object.keys(pairedShortcodes).forEach((name) =>
         eleventyConfig.addPairedShortcode(name, pairedShortcodes[name])
      );
   });

   // Collections
   eleventyConfig.addCollection("pages", (collectionApi) =>
      collectionApi.getFilteredByGlob("./site/pages/**/*")
   );
   eleventyConfig.addCollection("posts", (collectionApi) =>
      collectionApi.getFilteredByGlob("./site/posts/**/*.md")
   );
   eleventyConfig.addCollection("projects", (collectionApi) =>
      collectionApi.getFilteredByGlob("./site/projects/**/*.md")
   );

   if (process.env.NODE_ENV === "production") {
      // Transform : html-minifier
      eleventyConfig.addTransform(
         "html-minify",
         async (content, outputPath) => {
            if (outputPath && /(\.html|\.xml)$/.test(outputPath)) {
               return require("html-minifier").minify(content, {
                  useShortDoctype: true,
                  minifyJS: true,
                  collapseWhitespace: true,
                  keepClosingSlash: true,
               });
            }
            return content;
         }
      );
   }

   // Recognize Sass as a "template languages"
   eleventyConfig.addTemplateFormats("sass");
   // Compile Sass
   eleventyConfig.addExtension("sass", {
      outputFileExtension: "css",
      compile: async function (inputContent, inputPath) {
         // Skip files like _fileName.scss
         let parsed = path.parse(inputPath);
         if (parsed.name.startsWith("_")) {
            return;
         }

         // Run file content through Sass
         let result = sass.compileString(inputContent, {
            loadPaths: [parsed.dir || "."],
            sourceMap: true, // or true, your choice!,
            syntax: "indented", // ! .SASS files don't work without this line
         });

         // Allow included files from @use or @import to
         // trigger rebuilds when using --incremental
         this.addDependencies(inputPath, result.loadedUrls);

         let targets = browserslistToTargets(browserslist("defaults"));

         return async () => {
            let { code } = await transform({
               code: Buffer.from(result.css),
               minify: true,
               sourceMap: true,
               targets,
            });
            return code;
         };
      },
   });

   // Passthrough
   eleventyConfig.addPassthroughCopy({
      "site/static": ".",
      "site/admin/config.yml": "admin/config.yml",
   });

   // Globals
   eleventyConfig.addGlobalData(
      "isProduction",
      process.env.NODE_ENV === "production"
   );

   return {
      templateFormats: ["md", "njk", "html"],
      markdownTemplateEngine: "njk",
      htmlTemplateEngine: "njk",
      dir: {
         input: "./site",
         includes: `_themes/${theme}/layouts`,
         output: "./dist",
      },
   };
};
