/**
 * Basic box blur
 *
 * ---
 * @param {RGBImage} image Image to be blurred
 * @param {String} band Image band/channel to blur
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
      let cellCount = 0,
        sum = 0;

      for (let m = -radius; m <= radius; m++) {
        for (let n = -radius; n <= radius; n++) {
          if (
            !(m + h >= height || m + h <= -1 || n + w >= width || n + w <= -1)
          ) {
            cellCount++;
            sum += chosenBand[i + (width * m + n)];
          }
        }
      }

      newBand.push(Math.round(sum / cellCount));
    }
  }

  let newImage = RGBImage.from(image);

  newImage[band] = newBand;

  return newImage;
}
