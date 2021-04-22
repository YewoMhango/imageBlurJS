// This function uses the classic stackblur algorithm by Mario
// Klingemann, including `mul_table`, `shg_table` and all. This
// delivers the fastest performance but the drawback is that the
// blur radius is limited to 255 due to the lengths of `mul_table`
// and `shg_table`. To go beyond 255, it would require extending
// them with more values... or by not using `mul_table` and
// `shg_table` altogether, as we'll see in the next function

// prettier-ignore
const mul_table = new Uint16Array([
  512,512,512,456,328,456,335,512,405,328,271,456,388,335,292,512,
  454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
  482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
  437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
  497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
  320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
  446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
  329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
  505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
  399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
  324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
  268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
  451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
  385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
  332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
  289,287,285,282,280,278,275,273,271,269,267,265,263,261,259,257,
]);

// prettier-ignore
const shg_table = new Uint8Array([
   9,11,12,13,13,14,14,15,15,15,15,16,16,16,16,17,
  17,17,17,17,17,17,18,18,18,18,18,18,18,18,18,19,
  19,19,19,19,19,19,19,19,19,19,19,19,19,20,20,20,
  20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,
  21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,
  21,21,21,21,21,21,21,21,21,21,22,22,22,22,22,22,
  22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,
  22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,23,
  23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,
  23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,
  23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,
  23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,
  24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,
  24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,
  24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,
  24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,
]);

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
function optimizedStackBlur(image, band, radius) {
  const { width, height } = image;
  let firstNewBand = new Uint8ClampedArray(width * height);
  const chosenBand = image[band];
  const mul_sum = mul_table[radius];
  const shg_sum = shg_table[radius];

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

    firstNewBand[width * h] = (sum * mul_sum) >>> shg_sum;

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

  let newImage = RGBImage.from(image);

  newImage[band] = secondNewBand;

  return newImage;
}
