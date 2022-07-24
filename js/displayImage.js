import { create } from "./create.js";

/**
 * Displays an `RGBImage` on the page
 *
 * ---
 * @param {RGBImage} image Image to be displayed
 */

export function displayImage(image) {
  let { width, height } = image;

  let start = Date.now();

  let container = document.querySelector(".main-img-cont");
  container.innerHTML = "";

  let canvas = create("canvas", {
    width,
    height,
  });
  let cx = canvas.getContext("2d");

  let data = new Uint8ClampedArray(width * height * 4);

  // Whereas our `RGBImage` class stores data for the
  // three channels/bands in three separate arrays, the
  // `ImageData` class stores them in one array of `r, g,
  // b, a` subsequences for each pixel. As such we have
  // to combine the three arrays into one, and we just
  // assign values of 255 for the alpha channel for an
  // opacity of 100%

  for (let i = 0; i < width * height * 4; i += 4) {
    data[i] = image.red[i / 4];
    data[i + 1] = image.green[i / 4];
    data[i + 2] = image.blue[i / 4];
    data[i + 3] = 255;
  }

  data = new ImageData(data, width, height);

  cx.putImageData(data, 0, 0);

  container.append(canvas);

  let elapsed = Date.now() - start;
  console.log("Time taken to display image:", elapsed / 1000, "s");
}
