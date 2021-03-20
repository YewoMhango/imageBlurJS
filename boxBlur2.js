/**
 * Optimized box blur
 *
 * ---
 * @param {RGBImage} image Image to be blurred
 * @param {String} band Image band/channel to blur
 * @param {Number} radius Blur radius
 *
 * ---
 * @returns {RGBImage} A blurred image
 */
function optimizedBoxBlur(image, band, radius) {
  let firstNewBand = [];
  const chosenBand = image[band];
  const { width, height } = image;

  for (let h = 0; h < height; h++) {
    let sum = 0;
    let cellCount = radius + 1;

    for (let j = 0; j <= radius; j++) {
      sum += chosenBand[width * h + j];
    }

    firstNewBand.push(Math.round(sum / cellCount));

    for (let w = 1; w < width; w++) {
      if (w > radius) {
        sum -= chosenBand[width * h + w - radius - 1];
        cellCount--;
      }
      if (w < width - radius) {
        sum += chosenBand[width * h + w + radius];
        cellCount++;
      }
      firstNewBand.push(Math.round(sum / cellCount));
    }
  }

  let secondNewBand = [];

  for (let w = 0; w < width; w++) {
    let sum = 0;
    let cellCount = radius + 1;

    for (let j = 0; j <= radius; j++) {
      sum += firstNewBand[w + j * width];
    }

    secondNewBand[w] = Math.round(sum / cellCount);

    for (let h = 1; h < height; h++) {
      if (h > radius) {
        sum -= firstNewBand[w + width * (h - radius - 1)];
        cellCount--;
      }
      if (h < height - radius) {
        sum += firstNewBand[w + width * (h + radius)];
        cellCount++;
      }
      secondNewBand[w + width * h] = Math.round(sum / cellCount);
    }
  }

  let newImage = RGBImage.from(image);

  newImage[band] = secondNewBand;

  return newImage;
}
