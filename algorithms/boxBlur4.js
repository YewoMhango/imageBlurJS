// This version calculates the average by multiplying
// instead of dividing. It depends on the fact that
//
//     dividend/divisor = dividend*(1/divisor)
//
// As such, we can just compute `1/divisor` ahead of time
// and multiply the resulting value with the sum instead.
//
// This results in improved perfomance since division is
// a more costly operation than multiplication. As such,
// another area where this code differs from the other
// box blurs is that the number of pixels used is fixed.
// Therefore, at the edges of the picture, to make up
// the same number of pixels, the outermost one is added
// enough times to make up the same number of pixels

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
function multipliedBoxBlur(image, band, radius) {
  const { width, height } = image;
  const chosenBand = image[band];
  const multiplier = 1 / (radius * 2 + 1);

  let firstNewBand = new Uint8ClampedArray(width * height);

  for (let h = 0; h < height; h++) {
    // No more need for pixelCount since the number of "pixels"
    // virtually considered will be the same throughout
    let sum = 0;

    // First we add the first pixel enough times to
    // complement the other pixels to make up the
    // (radius * 2) + 1 elements required...
    for (let j = 1; j <= radius + 1; j++) {
      sum += chosenBand[width * h];
    }

    // ...then the following pixels within the required
    // radius of the pixel are added
    for (let j = 1; j <= radius; j++) {
      sum += chosenBand[width * h + j];
    }

    firstNewBand[width * h] = sum * multiplier;

    for (let w = 1; w < width; w++) {
      let currentPos = width * h + w;

      if (w > radius + 1) {
        sum -= chosenBand[currentPos - radius - 1];
      } else {
        sum -= chosenBand[width * h];
      }

      if (w < width - radius) {
        sum += chosenBand[currentPos + radius];
      } else {
        sum += chosenBand[width * h + width - 1];
      }

      firstNewBand[currentPos] = sum * multiplier;
    }
  }

  let secondNewBand = new Uint8ClampedArray(width * height);

  for (let w = 0; w < width; w++) {
    let sum = 0;

    for (let j = 1; j <= radius + 1; j++) {
      sum += firstNewBand[w];
    }

    for (let j = 1; j <= radius; j++) {
      sum += firstNewBand[w + j * width];
    }

    secondNewBand[w] = sum * multiplier;

    for (let h = 1; h < height; h++) {
      if (h > radius + 1) {
        sum -= firstNewBand[w + width * (h - radius - 1)];
      } else {
        sum -= firstNewBand[w];
      }

      if (h < height - radius) {
        sum += firstNewBand[w + width * (h + radius)];
      } else {
        sum += firstNewBand[w + width * (height - 1)];
      }

      secondNewBand[w + width * h] = sum * multiplier;
    }
  }

  let newImage = RGBImage.from(image);

  newImage[band] = secondNewBand;

  return newImage;
}
