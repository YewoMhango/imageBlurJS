// Compared to the basic box blur, this version finds
// the average for pixels whithin the radius of each
// pixel row-wise only and then column-wise.
// Additionally, we do not calculate the sum all over
// again for each pixel. Instead, we take the sum from
// the previous computation and add the newest pixel
// to enter within the radius of the current pixel,
// while subtracting the value of the pixel that has
// exited it. This makes sum computation to be an
// (almost) O(1) operation since it only needs to add
// and subtract 2 numbers from sum regardless of radius

/**
 * Optimized box blur
 *
 * ---
 * @param {RGBImage} image Image to be blurred
 * @param {"red" | "blue" | "green"} band Image band/channel to blur
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
    let pixelCount = radius + 1;

    // We start by creating a sum of the elements within
    // the radius of the first pixel. Later on we just
    // add and subtract from this sum as we move across
    // the image to calculate the new sums for each pixel
    for (let j = 0; j <= radius; j++) {
      sum += chosenBand[width * h + j];
    }

    firstNewBand.push(Math.round(sum / pixelCount));

    for (let w = 1; w < width; w++) {
      if (w > radius) {
        sum -= chosenBand[width * h + w - radius - 1];
        pixelCount--;
      }
      if (w < width - radius) {
        sum += chosenBand[width * h + w + radius];
        pixelCount++;
      }
      firstNewBand.push(Math.round(sum / pixelCount));
    }
  }

  let secondNewBand = [];

  for (let w = 0; w < width; w++) {
    let sum = 0;
    let pixelCount = radius + 1;

    for (let j = 0; j <= radius; j++) {
      sum += firstNewBand[w + j * width];
    }

    secondNewBand[w] = Math.round(sum / pixelCount);

    for (let h = 1; h < height; h++) {
      if (h > radius) {
        sum -= firstNewBand[w + width * (h - radius - 1)];
        pixelCount--;
      }
      if (h < height - radius) {
        sum += firstNewBand[w + width * (h + radius)];
        pixelCount++;
      }
      secondNewBand[w + width * h] = Math.round(sum / pixelCount);
    }
  }

  let newImage = RGBImage.from(image);

  newImage[band] = secondNewBand;

  return newImage;
}
