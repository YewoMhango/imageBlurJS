// A naive, first implementation of the basic box blur algorithm,
// which just sums all the numbers in a "moving window" for each
// pixel and divides by their count to find the average. It quickly
// gets very slow as radius increases since the complexity of
// determining the sum is O(r²) with respect to radius r

/**
 * Basic box blur
 *
 * ---
 * @param {RGBImage} image Image to be blurred
 * @param {"red" | "blue" | "green"} band Image band/channel to blur
 * @param {Number} radius Blur radius
 *
 * ---
 * @returns {RGBImage} A blurred image
 */
function boxBlur(image, band, radius) {
  let newBand = [];
  let chosenBand = image[band];
  let { width, height } = image;

  for (let i = 0, h = 0; h < height; h++) {
    for (let w = 0; w < width; w += 1, i += 1) {
      let pixelCount = 0,
        sum = 0;

      for (let m = -radius; m <= radius; m++) {
        for (let n = -radius; n <= radius; n++) {
          if (
            !(m + h >= height || m + h <= -1 || n + w >= width || n + w <= -1)
          ) {
            pixelCount++;
            sum += chosenBand[i + (width * m + n)];
          }
        }
      }

      newBand.push(Math.round(sum / pixelCount));
    }
  }

  let newImage = RGBImage.from(image);

  newImage[band] = newBand;

  return newImage;
}
