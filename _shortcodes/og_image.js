// Generates image. (This will overwrite images in og_image.png)

const PImage = require("pureimage");
const fs = require("fs");

function drawMultilineText(ctx, text, x, y, lineHeight) {
   const lines = text.split("\n");
   for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + i * lineHeight);
   }
}

function createOGImageCanvas(textName, textTitle, colorBg, colorText) {
   const fnt = PImage.registerFont(
      "./assets/CrimsonText-Regular.ttf",
      "Crimson Text"
   );
   fnt.loadSync();

   const width = 1200; // OG image dimensions
   const height = 630;
   const img = PImage.make(width, height);
   const ctx = img.getContext("2d");

   // Set Background
   ctx.fillStyle = colorBg;
   ctx.fillRect(0, 0, width, height);

   // Set and Draw Name Text
   ctx.fillStyle = colorText;
   ctx.font = "150pt Crimson Text";
   ctx.textAlign = "center";
   ctx.textBaseline = "middle";
   drawMultilineText(ctx, textName, width / 2, height / 2 - 75, 175);

   // Set and Draw Title Text
   ctx.font = "75pt Crimson Text";
   ctx.fillText(textTitle, width / 2, height / 2 + 100);

   return img;
}

function saveImageToDisk(img, outputPath) {
   PImage.encodePNGToStream(img, fs.createWriteStream(outputPath))
      .then(() => {
         console.log(`OG Image generated at ${outputPath}`);
      })
      .catch((err) => {
         console.error(`Error saving image: ${err}`);
      });
}

function imageExists(path) {
   try {
      fs.accessSync(path, fs.constants.F_OK);
      return true; // File exists
   } catch (err) {
      return false; // File doesn't exist
   }
}

function generateOGImageFromText(
   textName,
   textTitle,
   outputPath = "./dist/og_image.png",
   colorBg,
   colorText
) {
   if (imageExists(outputPath)) {
      return `<meta property="og:image" content="/og_image.png">`;
   }

   const img = createOGImageCanvas(textName, textTitle, colorBg, colorText);
   saveImageToDisk(img, outputPath);
   return `<meta property="og:image" content="/og_image.png">`;
}

module.exports = {
   generateOGImage: function (
      name = "Name",
      title = "Title",
      outputPath = undefined,
      colorBg = "darkblue",
      colorText = "white"
   ) {
      return generateOGImageFromText(
         name,
         title,
         outputPath,
         colorBg,
         colorText
      );
   },
};
