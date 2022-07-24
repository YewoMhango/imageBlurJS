import RGBImage from "./RGBImage.js";
import { setLoadedImage } from "./main.js";
import { create } from "./create.js";
import { displayImage } from "./displayImage.js";

/**
 * Reads a selected file and translates it into an `RGBImage` as the global variable `loadedImage`
 *
 * ---
 * @param {Blob} file The file which has been selected by the user
 */
export function finishLoad(file) {
  if (file == null) return;
  let reader = new FileReader();
  reader.addEventListener("load", () => {
    let image = create("img", {
      onload: () => {
        let loadedImage = pictureFromImage(image);
        setLoadedImage(loadedImage);
        displayLoadedImage(loadedImage);
        document.querySelector("main").hidden = false;
      },
      src: reader.result,
    });
  });
  reader.readAsDataURL(file);
}

/**
 * Generates a new `RGBImage` from a given `HTMLImageElement`
 *
 * ---
 * @param {HTMLImageElement} image An `HTMLImageElement` element from which the new `RGBImage` is created
 *
 * ---
 * @returns {RGBImage} A new `RGBImage`
 */
function pictureFromImage(image) {
  let width = image.width;
  let originalWidth = width;
  let height = image.height;
  let canvas = create("canvas", {
    width,
    height,
  });
  let cx = canvas.getContext("2d");
  cx.drawImage(image, 0, 0);
  let { data } = cx.getImageData(0, 0, width, height);

  let scale = 1;

  if (
    width * height > 2160 * 2160 &&
    document.querySelector("input#scale-down").checked == true
  ) {
    // If the image size exceeds 2160 * 2160, we want to scale it
    // down to avoid overloading memory

    scale = Math.pow(
      2,
      Math.floor(Math.log2(Math.sqrt(width * height) / 1080))
    );
    width = Math.floor(width / scale);
    height = Math.floor(height / scale);
  }

  let red = new Uint8ClampedArray(width * height);
  let green = new Uint8ClampedArray(width * height);
  let blue = new Uint8ClampedArray(width * height);

  // The `data` property of the ImageData class is one
  // array which stores all the pixel values in `r, g, b,
  // a` subsequences for each pixel. However, we want to
  // split the data into 3 separate arrays for red, green
  // and blue while ignoring the alpha channel

  for (let h = 0; h < height; h++) {
    for (let w = 0; w < width; w++) {
      let i1 = w + h * width;
      let i2 = (w + h * originalWidth) * scale * 4;
      red[i1] = data[i2];
      green[i1] = data[i2 + 1];
      blue[i1] = data[i2 + 2];
    }
  }

  return new RGBImage(red, green, blue, width, height);
}

/**
 * Displays a loaded image onto the screen
 *
 * ---
 * @param {RGBImage} image The image to display
 */
function displayLoadedImage(image) {
  displayImage(image);

  let minDimension = Math.min(image.height - 1, image.width - 1, 255);

  document.querySelector(".blur-radius input").max = minDimension;
  document.querySelector(".blur-radius .radius").innerHTML =
    document.querySelector(".blur-radius input").value;
}
