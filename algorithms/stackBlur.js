/**
 * Blurs an image using the Stackblur algorithm
 *
 * ---
 * @param {RGBImage} image Image to be blurred
 * @param {String} band Image band/channel to blur
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
    let stack = 0;
    let cellCount = 0;
    let incoming_items = 0;
    let outgoing_items = 0;

    for (let j = 0; j <= radius; j++) {
      incoming_items += chosenBand[width * h + j];
      stack += chosenBand[width * h + j] * (radius - j + 1);
      cellCount += radius - j + 1;
    }

    firstNewBand[width * h] = Math.round(stack / cellCount);

    for (let w = 1; w < width; w++) {
      if (w > radius + 1) {
        outgoing_items -= chosenBand[width * h + w - radius - 2];
      }
      if (w >= width - radius) {
        cellCount -= radius + 1 - width + w;
      }
      if (w < width - radius) {
        incoming_items += chosenBand[width * h + w + radius];
      }
      if (w <= radius) {
        cellCount += radius + 1 - w;
      }

      outgoing_items += chosenBand[width * h + w - 1];
      incoming_items -= chosenBand[width * h + w - 1];
      stack += incoming_items - outgoing_items;

      firstNewBand[width * h + w] = Math.round(stack / cellCount);
    }
  }

  let secondNewBand = new Uint8ClampedArray(width * height);

  for (let w = 0; w < width; w++) {
    let stack = 0;
    let cellCount = 0;
    let incoming_items = 0;
    let outgoing_items = 0;

    for (let j = 0; j <= radius; j++) {
      incoming_items += firstNewBand[w + j * width];
      stack += firstNewBand[w + j * width] * (radius - j + 1);
      cellCount += radius - j + 1;
    }

    secondNewBand[w] = Math.round(stack / cellCount);

    for (let h = 1; h < height; h++) {
      if (h > radius + 1) {
        outgoing_items -= firstNewBand[w + width * (h - radius - 2)];
      }
      if (h >= height - radius) {
        cellCount -= radius + 1 - height + h;
      }
      if (h < height - radius) {
        incoming_items += firstNewBand[w + width * (h + radius)];
      }
      if (h <= radius) {
        cellCount += radius + 1 - h;
      }

      outgoing_items += firstNewBand[w + width * (h - 1)];
      incoming_items -= firstNewBand[w + width * (h - 1)];
      stack += incoming_items - outgoing_items;

      secondNewBand[w + width * h] = Math.round(stack / cellCount);
    }
  }

  let newImage = RGBImage.from(image);

  newImage[band] = secondNewBand;

  return newImage;
}
