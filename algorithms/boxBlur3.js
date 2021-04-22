// Compared to the first optimized box blur, this version
// uses a Uint8ClampedArray for faster access times.

/**
 * Further optimized box blur
 *
 * ---
 * @param {RGBImage} image Image to be blurred
 * @param {"red" | "blue" | "green"} band Image band/channel to blur
 * @param {Number} radius Blur radius
 *
 * ---
 * @returns {RGBImage} A blurred image
 */
function furtherOptimizedBoxBlur(image, band, radius) {
  const { width, height } = image;
  const chosenBand = image[band];

  let firstNewBand = new Uint8ClampedArray(width * height);

  for (let h = 0; h < height; h++) {
    let sum = 0;
    let pixelCount = radius + 1;

    for (let j = 0; j <= radius; j++) {
      sum += chosenBand[width * h + j];
    }

    firstNewBand[width * h] = Math.round(sum / pixelCount);

    for (let w = 1; w < width; w++) {
      if (w > radius) {
        sum -= chosenBand[width * h + w - radius - 1];
        pixelCount--;
      }
      if (w < width - radius) {
        sum += chosenBand[width * h + w + radius];
        pixelCount++;
      }
      firstNewBand[width * h + w] = Math.round(sum / pixelCount);
    }
  }

  let secondNewBand = new Uint8ClampedArray(width * height);

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
