// This function uses the stackblur algorithm for smoother
// blurring but, instead of using the `mul_table` and
// `shg_table` as in the original by Mario Klingemann,
// this function simply finds the sum of the stack and
// divides it normally. Also, `pixelCount` is necessary
// since the number of pixels added changes at the edges
// of the image

/**
 * Blurs an image using the Stackblur algorithm
 *
 * ---
 * @param {RGBImage} image Image to be blurred
 * @param {"red" | "blue" | "green"} band Image band/channel to blur
 * @param {Number} radius Blur radius
 *
 * ---
 * @returns {RGBImage} A blurred image
 */
function stackBlur(image, band, radius) {
  let { width, height } = image;
  let chosenBand = image[band];
  let firstNewBand = new Uint8ClampedArray(width * height);

  for (let h = 0; h < height; h++) {
    let sum = 0;
    let pixelCount = 0;
    let incoming_items = 0;
    let outgoing_items = 0;

    for (let j = 0; j <= radius; j++) {
      incoming_items += chosenBand[width * h + j];
      sum += chosenBand[width * h + j] * (radius - j + 1);
      pixelCount += radius - j + 1;
    }

    firstNewBand[width * h] = Math.round(sum / pixelCount);

    for (let w = 1; w < width; w++) {
      if (w > radius + 1) {
        outgoing_items -= chosenBand[width * h + w - radius - 2];
      }
      if (w >= width - radius) {
        pixelCount -= radius + 1 - width + w;
      }
      if (w < width - radius) {
        incoming_items += chosenBand[width * h + w + radius];
      }
      if (w <= radius) {
        pixelCount += radius + 1 - w;
      }

      outgoing_items += chosenBand[width * h + w - 1];
      incoming_items -= chosenBand[width * h + w - 1];
      sum += incoming_items - outgoing_items;

      firstNewBand[width * h + w] = Math.round(sum / pixelCount);
    }
  }

  let secondNewBand = new Uint8ClampedArray(width * height);

  for (let w = 0; w < width; w++) {
    let sum = 0;
    let pixelCount = 0;
    let incoming_items = 0;
    let outgoing_items = 0;

    for (let j = 0; j <= radius; j++) {
      incoming_items += firstNewBand[w + j * width];
      sum += firstNewBand[w + j * width] * (radius - j + 1);
      pixelCount += radius - j + 1;
    }

    secondNewBand[w] = Math.round(sum / pixelCount);

    for (let h = 1; h < height; h++) {
      if (h > radius + 1) {
        outgoing_items -= firstNewBand[w + width * (h - radius - 2)];
      }
      if (h >= height - radius) {
        pixelCount -= radius + 1 - height + h;
      }
      if (h < height - radius) {
        incoming_items += firstNewBand[w + width * (h + radius)];
      }
      if (h <= radius) {
        pixelCount += radius + 1 - h;
      }

      outgoing_items += firstNewBand[w + width * (h - 1)];
      incoming_items -= firstNewBand[w + width * (h - 1)];
      sum += incoming_items - outgoing_items;

      secondNewBand[w + width * h] = Math.round(sum / pixelCount);
    }
  }

  let newImage = RGBImage.from(image);

  newImage[band] = secondNewBand;

  return newImage;
}
