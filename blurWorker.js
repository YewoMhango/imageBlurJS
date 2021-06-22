/**
 * A "map" of all the functions for the algorithms which are used
 */
let algorithms = {
  box: boxBlur,
  box2: optimizedBoxBlur,
  box3: furtherOptimizedBoxBlur,
  box4: multipliedBoxBlur,
  stack: stackBlur,
  stack2: optimizedStackBlur,
  stack3: multipliedStackblur,
  gaussian: fauxGaussianBlur,
};

addEventListener("message", (event) => {
  let { band, width, height, radius, selected } = event.data;

  let blurFunction = algorithms[selected];

  postMessage(blurFunction(new Uint8ClampedArray(band), width, height, radius));
});

/**
 * # Basic Box Blur
 * A naive, first implementation of the box blur algorithm,
 * which just sums all the numbers within the given radius for each
 * pixel and divides by their count to find the average. It quickly
 * gets very slow as radius increases since the complexity of
 * determining the sum is O(r²) with respect to radius r
 *
 * ---
 * @param {Uint8ClampedArray} band Image band/channel to be blurred
 * @param {Number} width Image width
 * @param {Number} height Image height
 * @param {Number} radius Blur radius
 * @returns A blurred band of the image
 */
function boxBlur(band, width, height, radius) {
  let newBand = [];

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
            sum += band[i + (width * m + n)];
          }
        }
      }

      newBand.push(Math.round(sum / pixelCount));
    }
  }

  return newBand;
}

/**
 * # Optimized Box Blur
 * Compared to the basic box blur, this version finds
 * the average for pixels whithin the radius of each
 * pixel row-wise only and then column-wise.
 *
 * Additionally, we do not calculate the sum all over
 * again for each pixel. Instead, we take the sum from
 * the previous computation and add the newest pixel
 * to enter within the radius of the current pixel,
 * while subtracting the value of the pixel that has
 * exited it.
 *
 * This makes sum computation to be an
 * (almost) O(1) operation since it only needs to add
 * and subtract 2 numbers from sum regardless of radius
 *
 * ---
 * @param {Uint8ClampedArray} band Image band/channel to be blurred
 * @param {Number} width Image width
 * @param {Number} height Image height
 * @param {Number} radius Blur radius
 * @returns A blurred band of the image
 */
function optimizedBoxBlur(band, width, height, radius) {
  let firstNewBand = [];

  for (let h = 0; h < height; h++) {
    let sum = 0;
    let pixelCount = radius + 1;

    // We start by creating a sum of the elements within
    // the radius of the first pixel. Later on we just
    // add and subtract from this sum as we move across
    // the image to calculate the new sums for each pixel
    for (let j = 0; j <= radius; j++) {
      sum += band[width * h + j];
    }

    firstNewBand.push(Math.round(sum / pixelCount));

    for (let w = 1; w < width; w++) {
      if (w > radius) {
        sum -= band[width * h + w - radius - 1];
        pixelCount--;
      }
      if (w < width - radius) {
        sum += band[width * h + w + radius];
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

  return secondNewBand;
}

/**
 * # Further Optimized Box Blur
 * Compared to the first optimized box blur, this version
 * uses a Uint8ClampedArray for faster access times.
 *
 * ---
 * @param {Uint8ClampedArray} band Image band/channel to be blurred
 * @param {Number} width Image width
 * @param {Number} height Image height
 * @param {Number} radius Blur radius
 * @returns A blurred band of the image
 */
function furtherOptimizedBoxBlur(band, width, height, radius) {
  let firstNewBand = new Uint8ClampedArray(width * height);

  for (let h = 0; h < height; h++) {
    let sum = 0;
    let pixelCount = radius + 1;

    for (let j = 0; j <= radius; j++) {
      sum += band[width * h + j];
    }

    firstNewBand[width * h] = Math.round(sum / pixelCount);

    for (let w = 1; w < width; w++) {
      if (w > radius) {
        sum -= band[width * h + w - radius - 1];
        pixelCount--;
      }
      if (w < width - radius) {
        sum += band[width * h + w + radius];
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

  return secondNewBand;
}

/**
 * # Multiplied Box Blur
 * This version calculates the average by *multiplying*
 * instead of *dividing*. It depends on the fact that
 *```
 * dividend/divisor = dividend*(1/divisor)
 *```
 * As such, we can just compute `1/divisor` ahead of time
 * and multiply the resulting value with the sum instead
 * (our dividend)
 *
 * This results in improved perfomance since division is
 * a more costly operation than multiplication. As such,
 * another area where this code differs from the other
 * box blurs is that the number of pixels used is fixed.
 * Therefore, at the edges of the picture, the outermost
 * pixel is added enough times to make up the same number
 * of pixels
 *
 * ---
 * @param {Uint8ClampedArray} band Image band/channel to be blurred
 * @param {Number} width Image width
 * @param {Number} height Image height
 * @param {Number} radius Blur radius
 * @returns A blurred band of the image
 */
function multipliedBoxBlur(band, width, height, radius) {
  const multiplier = 1 / (radius * 2 + 1);

  let firstNewBand = new Uint8ClampedArray(width * height);

  for (let h = 0; h < height; h++) {
    // No more need for pixelCount since the number of pixels
    // virtually considered will be the same throughout
    let sum = 0;

    // First we add the first pixel enough times to
    // complement the other pixels to make up the
    // (radius * 2) + 1 elements required...
    for (let j = 1; j <= radius + 1; j++) {
      sum += band[width * h];
    }

    // ...then the following pixels within the required
    // radius of the pixel are added
    for (let j = 1; j <= radius; j++) {
      sum += band[width * h + j];
    }

    firstNewBand[width * h] = sum * multiplier;

    for (let w = 1; w < width; w++) {
      let currentPos = width * h + w;

      if (w > radius + 1) {
        sum -= band[currentPos - radius - 1];
      } else {
        sum -= band[width * h];
      }

      if (w < width - radius) {
        sum += band[currentPos + radius];
      } else {
        sum += band[width * h + width - 1];
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

  return secondNewBand;
}

/**
 * # Basic Stackblur
 * This function uses the stackblur algorithm for smoother
 * blurring. It is a compromise between the box blur's
 * faster perfomance and the gaussian blur's smoothness
 *
 * Instead of using the `mul_table` and
 * `shg_table` as in the original by Mario Klingemann,
 * this particular function simply finds the sum of the
 * stack and divides it normally.
 *
 * ---
 * @param {Uint8ClampedArray} band Image band/channel to be blurred
 * @param {Number} width Image width
 * @param {Number} height Image height
 * @param {Number} radius Blur radius
 * @returns A blurred band of the image
 */
function stackBlur(band, width, height, radius) {
  let firstNewBand = new Uint8ClampedArray(width * height);

  for (let h = 0; h < height; h++) {
    let sum = 0;
    let pixelCount = 0;
    let incoming_items = 0;
    let outgoing_items = 0;

    for (let j = 0; j <= radius; j++) {
      incoming_items += band[width * h + j];
      sum += band[width * h + j] * (radius - j + 1);
      pixelCount += radius - j + 1;
    }

    firstNewBand[width * h] = Math.round(sum / pixelCount);

    for (let w = 1; w < width; w++) {
      if (w > radius + 1) {
        outgoing_items -= band[width * h + w - radius - 2];
      }
      if (w >= width - radius) {
        pixelCount -= radius + 1 - width + w;
      }
      if (w < width - radius) {
        incoming_items += band[width * h + w + radius];
      }
      if (w <= radius) {
        pixelCount += radius + 1 - w;
      }

      outgoing_items += band[width * h + w - 1];
      incoming_items -= band[width * h + w - 1];
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

  return secondNewBand;
}

// prettier-ignore
const mul_table = new Uint16Array([
  512, 512, 512, 456, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512,
  454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512,
  482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456,
  437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512,
  497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328,
  320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456,
  446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335,
  329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512,
  505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405,
  399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328,
  324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271,
  268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456,
  451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388,
  385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335,
  332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292,
  289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259, 257,
]);

// prettier-ignore
const shg_table = new Uint8Array([
  9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
  17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
  19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
  20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
  21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
  21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
  22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
  22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
  23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
  23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
  23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
  23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
]);

/**
 * # Classic Stackblur
 * This function uses the classic stackblur algorithm by Mario
 * Klingemann, including `mul_table`, `shg_table` and all. This
 * delivers the fastest stackblur performance but the biggest
 * drawback is that the blur radius is limited to 255 due to the
 * lengths of `mul_table` and `shg_table`. To go beyond 255, it
 * would require extending them with more values... or by not
 * using `mul_table` and `shg_table` altogether, as in the other
 * two stackblur functions given here.
 *
 * Another weakness of this one is that it gives an overly bright and
 * an overly dark image when radius is 2 and 3, respectively. This is
 * also due to the values in the `mul_table` and `shg_table`.
 *
 * ---
 * @param {Uint8ClampedArray} band Image band/channel to be blurred
 * @param {Number} width Image width
 * @param {Number} height Image height
 * @param {Number} radius Blur radius
 * @returns A blurred band of the image
 */
function optimizedStackBlur(band, width, height, radius) {
  let firstNewBand = new Uint8ClampedArray(width * height);
  const mul_sum = mul_table[radius];
  const shg_sum = shg_table[radius];

  for (let h = 0; h < height; h++) {
    let sum = 0;
    let incoming_items = band[width * h];
    let outgoing_items = band[width * h] * (radius + 1);

    for (let j = 1; j <= radius + 1; j++) {
      sum += band[width * h] * j;
    }

    for (let j = 1; j <= radius; j++) {
      incoming_items += band[width * h + j];
      sum += band[width * h + j] * (radius - j + 1);
    }

    firstNewBand[width * h] = (sum * mul_sum) >>> shg_sum;

    for (let w = 1; w < width; w++) {
      let currentPos = width * h + w;
      if (w > radius + 1) {
        outgoing_items -= band[currentPos - radius - 2];
      } else {
        outgoing_items -= band[width * h];
      }

      if (w < width - radius) {
        incoming_items += band[currentPos + radius];
      } else {
        incoming_items += band[width * h + width - 1];
      }

      outgoing_items += band[currentPos - 1];
      incoming_items -= band[currentPos - 1];
      sum += incoming_items - outgoing_items;

      firstNewBand[currentPos] = (sum * mul_sum) >>> shg_sum;
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

    secondNewBand[w] = (sum * mul_sum) >>> shg_sum;

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

      secondNewBand[w + width * h] = (sum * mul_sum) >>> shg_sum;
    }
  }

  return secondNewBand;
}

/**
 * # Multiplied Stackblur
 * This function, unlike the true, original stackblur,
 * finds the average by simply multiplying the sum
 * with `multiplier`, where
 *```
 * multiplier = 1 / (radius * (radius + 2) + 1)
 *```
 * Here, `radius * (radius + 2) + 1` is the count of
 * elements in the virtual "stacks" of pixel values. As
 * such, since we calculate 1/count ahead of time, we
 * can just *multiply* it with the sum, for every pixel,
 * instead of *dividing* (which is a slower operation) or
 * using bitwise operators as in the original stackblur.
 *
 * This is method is *slightly* slower than the bitwise
 * operator method but its main advantage is that we
 * can use any blur radius beyond 255 easily
 *
 * ---
 * @param {Uint8ClampedArray} band Image band/channel to be blurred
 * @param {Number} width Image width
 * @param {Number} height Image height
 * @param {Number} radius Blur radius
 * @returns A blurred band of the image
 */
function multipliedStackblur(band, width, height, radius) {
  let firstNewBand = new Uint8ClampedArray(width * height);
  const multiplier = 1 / (radius * (radius + 2) + 1);

  for (let h = 0; h < height; h++) {
    let sum = 0;
    let incoming_items = band[width * h];
    let outgoing_items = band[width * h] * (radius + 1);

    for (let j = 1; j <= radius + 1; j++) {
      sum += band[width * h] * j;
    }

    for (let j = 1; j <= radius; j++) {
      incoming_items += band[width * h + j];
      sum += band[width * h + j] * (radius - j + 1);
    }

    firstNewBand[width * h] = sum * multiplier;

    for (let w = 1; w < width; w++) {
      let currentPos = width * h + w;
      if (w > radius + 1) {
        outgoing_items -= band[currentPos - radius - 2];
      } else {
        outgoing_items -= band[width * h];
      }

      if (w < width - radius) {
        incoming_items += band[currentPos + radius];
      } else {
        incoming_items += band[width * h + width - 1];
      }

      outgoing_items += band[currentPos - 1];
      incoming_items -= band[currentPos - 1];
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

  return secondNewBand;
}

/**
 * # Faux Gaussian blur
 * This computes a Gaussian blur using three passes of a
 * box blur. For more information check out
 * [this article](http://blog.ivank.net/fastest-gaussian-blur.html)
 *
 * ---
 * @param {Uint8ClampedArray} band Image band/channel to be blurred
 * @param {Number} width Image width
 * @param {Number} height Image height
 * @param {Number} radius Blur radius
 * @returns A blurred band of the image
 */
function fauxGaussianBlur(band, width, height, radius) {
  return multipliedBoxBlur(
    multipliedBoxBlur(
      multipliedBoxBlur(band, width, height, radius),
      width,
      height,
      radius
    ),
    width,
    height,
    radius
  );
}

async function initWasm() {
  let { instance } = await WebAssembly.instantiateStreaming(
    fetch("./blur.wasm")
  );

  let buffer_address = instance.exports.BUFFER.value;
  const MAX_SIZE = instance.exports.get_max_size();

  /**
   *
   * @param {Uint8ClampedArray} band
   * @param {Number} width
   * @param {Number} height
   * @param {Number} radius
   */
  algorithms.boxWasm = function (band, width, height, radius) {
    if (width * height > MAX_SIZE) {
      throw new Error(
        "The image exceeds the maximum size in pixels supported by these WASM functions (" +
          MAX_SIZE +
          " pixels)"
      );
    }

    let memory = new Uint8ClampedArray(
      instance.exports.memory.buffer,
      buffer_address,
      width * height
    );

    for (let i = 0; i < band.length; i++) {
      memory[i] = band[i];
    }

    instance.exports.box_blur(width, height, radius);

    return new Uint8ClampedArray(memory);
  };

  /**
   *
   * @param {Uint8ClampedArray} band
   * @param {Number} width
   * @param {Number} height
   * @param {Number} radius
   */
  algorithms.stackWasm = function (band, width, height, radius) {
    if (width * height > MAX_SIZE) {
      throw new Error(
        "The image exceeds the maximum size in pixels supported by these WASM functions (" +
          MAX_SIZE +
          " pixels)"
      );
    }

    let memory = new Uint8ClampedArray(
      instance.exports.memory.buffer,
      buffer_address,
      width * height
    );

    for (let i = 0; i < band.length; i++) {
      memory[i] = band[i];
    }

    instance.exports.stack_blur(width, height, radius);

    return new Uint8ClampedArray(memory);
  };
  /**
   *
   * @param {Uint8ClampedArray} band
   * @param {Number} width
   * @param {Number} height
   * @param {Number} radius
   */
  algorithms.gaussianWasm = function (band, width, height, radius) {
    if (width * height > MAX_SIZE) {
      throw new Error(
        "The image exceeds the maximum size in pixels supported by these WASM functions (" +
          MAX_SIZE +
          " pixels)"
      );
    }

    let memory = new Uint8ClampedArray(
      instance.exports.memory.buffer,
      buffer_address,
      width * height
    );

    for (let i = 0; i < band.length; i++) {
      memory[i] = band[i];
    }

    instance.exports.box_blur(width, height, radius);
    instance.exports.box_blur(width, height, radius);
    instance.exports.box_blur(width, height, radius);

    return new Uint8ClampedArray(memory);
  };
}
initWasm();
