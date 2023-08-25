import * as PImage from "pureimage";
import * as fs from "fs";

function generateOGImageFromText(text, outputPath) {
   var fnt = PImage.registerFont("CrimsonText-Regular.ttf", "Crimson Text");
   fnt.loadSync();

   const width = 1200; // Recommended OG image dimensions
   const height = 630;

   const img = PImage.make(width, height);

   const ctx = img.getContext("2d");

   // Background color
   ctx.fillStyle = "#FFFFFF";
   ctx.fillRect(0, 0, width, height);

   // Text settings
   ctx.fillStyle = "#000000";
   ctx.font = "48pt Crimson Text";
   ctx.textAlign = "center";
   ctx.textBaseline = "middle";
   ctx.fillText(text, width / 2, height / 2);

   // Save the image
   PImage.encodePNGToStream(img, fs.createWriteStream(outputPath))
      .then(() => {
         console.log(`Image saved to ${outputPath}`);
      })
      .catch((err) => {
         console.error(`Error saving image: ${err}`);
      });
}

// Example usage:

module.exports = {
   generateOGImage: function (text) {
      return generateOGImageFromText(text, "./og-image.png");
   },
};
