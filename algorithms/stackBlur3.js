// This function, unlike the true, original stackblur,
// finds the average by simply multiplying the sum
// with `multiplier`, where
//
//      multiplier = 1 / (radius * (radius + 2) + 1)
//
// Here, radius * (radius + 2) + 1 is the count of
// elements in the virtual "stack" of pixel values. As
// such, since we calculate 1/count ahead of time, we
// can just multiply it with the sum, for every pixel,
// instead of dividing (which is a slower operation) or
// using bitwise operators as in the original stackblur.
//
// This is method is slightly slower than the bitwise
// operator method but its main advantage is that we
// can now use any blur radius beyond 255

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
function multipliedStackblur(image, band, radius) {
  const { width, height } = image;
  let firstNewBand = new Uint8ClampedArray(width * height);
  const chosenBand = image[band];
  const multiplier = 1 / (radius * (radius + 2) + 1);

  for (let h = 0; h < height; h++) {
    let sum = 0;
    let incoming_items = chosenBand[width * h];
    let outgoing_items = chosenBand[width * h] * (radius + 1);

    for (let j = 1; j <= radius + 1; j++) {
      sum += chosenBand[width * h] * j;
    }

    for (let j = 1; j <= radius; j++) {
      incoming_items += chosenBand[width * h + j];
      sum += chosenBand[width * h + j] * (radius - j + 1);
    }

    firstNewBand[width * h] = sum * multiplier;

    for (let w = 1; w < width; w++) {
      let currentPos = width * h + w;
      if (w > radius + 1) {
        outgoing_items -= chosenBand[currentPos - radius - 2];
      } else {
        outgoing_items -= chosenBand[width * h];
      }

      if (w < width - radius) {
        incoming_items += chosenBand[currentPos + radius];
      } else {
        incoming_items += chosenBand[width * h + width - 1];
      }

      outgoing_items += chosenBand[currentPos - 1];
      incoming_items -= chosenBand[currentPos - 1];
      sum += incoming_items - outgoing_items;

      firstNewBand[currentPos] = sum * multiplier;
    }
  }

  let secondNewBand = new Uint8ClampedArray(width * height);

  for (let w = 0; w < width; w++) {
    let sum = 0;
    let incoming_items = firstNewBand[w];
    let outgoing_items = firstNewBand[w] * (radius + 1);

    for (let j = 1; j <= radius + 1; j++) {
      sum += firstNewBand[w] * j;
    }

    for (let j = 1; j <= radius; j++) {
      incoming_items += firstNewBand[w + j * width];
      sum += firstNewBand[w + j * width] * (radius - j + 1);
    }

    secondNewBand[w] = sum * multiplier;

    for (let h = 1; h < height; h++) {
      if (h > radius + 1) {
        outgoing_items -= firstNewBand[w + width * (h - radius - 2)];
      } else {
        outgoing_items -= firstNewBand[w];
      }

      if (h < height - radius) {
        incoming_items += firstNewBand[w + width * (h + radius)];
      } else {
        incoming_items += firstNewBand[w + width * (height - 1)];
      }

      outgoing_items += firstNewBand[w + width * (h - 1)];
      incoming_items -= firstNewBand[w + width * (h - 1)];
      sum += incoming_items - outgoing_items;

      secondNewBand[w + width * h] = sum * multiplier;
    }
  }

  let newImage = RGBImage.from(image);

  newImage[band] = secondNewBand;

  return newImage;
}
