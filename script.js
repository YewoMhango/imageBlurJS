/**
 * A global variable representing the original image loaded by the user
 */
let loadedImage;
/**
 * Is true when a user has confirmed that they are sure they want to use the slow basic box blur
 */
let confirmedBasicBox = false;
/**
 * An array of web workers for performing the processing in parallel
 */
let webWorkers = [
  new Worker("blurWorker.js"),
  new Worker("blurWorker.js"),
  new Worker("blurWorker.js"),
];

for (let worker of webWorkers) {
  worker.addEventListener("error", (e) => {
    alert(e.message);
    document.querySelector('input[type="range"]').disabled = false;
    document.querySelector(".load-anim").style.display = "none"
  });
}

/**
 * A representation of an RGB Image. I chose to create a
 * special class so that each color band could be stored in
 * a separate Array to simplify the blurring code.
 */
class RGBImage {
  /**
   * Creates a new `RGBImage` instance
   *
   * ---
   * @param {Uint8ClampedArray} red Red band data
   * @param {Uint8ClampedArray} green Green band data
   * @param {Uint8ClampedArray} blue Blue band data
   * @param {Number} width Image width
   * @param {Number} height Image height
   *
   * ---
   * @returns {RGBImage} A new `RGBImage` object
   */
  constructor(red, green, blue, width, height) {
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.width = width;
    this.height = height;
  }
  /**
   * Creates a new `RGBImage` instance from an existing one
   *
   * ---
   * @param {RGBImage} image Another `RGBImage` instance
   *
   * ---
   * @returns {RGBImage} A new `RGBImage` object
   */
  static from(image) {
    return new RGBImage(
      image.red,
      image.green,
      image.blue,
      image.width,
      image.height
    );
  }
}

/**
 * Responds to the `onchange` event on the radius slider
 */
function radiusChanged() {
  document.querySelector(
    ".blur-radius span.radius"
  ).innerHTML = document.querySelector(".blur-radius input").value;
  try {
    performBlurring();
  } catch (e) {
    document.querySelector('input[type="range"]').disabled = false;
    document.querySelector(".load-anim").style.display = "none"
    alert(e.message);
  }
}

/**
 * Starts the process of loading an image when the `Input a file` button is clicked
 */
function startLoad() {
  let input = elt("input", {
    type: "file",
    onchange: () => finishLoad(input.files[0]),
    accept: "image/*",
  });
  document.body.appendChild(input);
  input.click();
  input.remove();
}

/**
 * Reads a selected file and translates it into an `RGBImage` as the global variable `loadedImage`
 *
 * ---
 * @param {Blob} file The file which has been selected by the user
 */
function finishLoad(file) {
  if (file == null) return;
  let reader = new FileReader();
  reader.addEventListener("load", () => {
    let image = elt("img", {
      onload: () => {
        loadedImage = pictureFromImage(image);
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
  let height = image.height;
  let canvas = elt("canvas", {
    width,
    height,
  });
  let cx = canvas.getContext("2d");
  cx.drawImage(image, 0, 0);
  let { data } = cx.getImageData(0, 0, width, height);

  let red = new Uint8ClampedArray(width * height);
  let green = new Uint8ClampedArray(width * height);
  let blue = new Uint8ClampedArray(width * height);

  // The `data` property of the ImageData class is one
  // array which stores all the pixel values in `r, g, b,
  // a` subsequences for each pixel. However, we want to
  // split the data into 3 separate arrays for red, green
  // and blue while ignoring the alpha channel
  for (let i = 0; i < data.length; i += 4) {
    let [r, g, b] = data.slice(i, i + 3);
    red[i / 4] = r;
    green[i / 4] = g;
    blue[i / 4] = b;
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
  displayImage(image, ".main-img-cont");

  let minDimension = Math.min(image.height - 1, image.width - 1, 255);

  document.querySelector(".blur-radius input").max = minDimension;
  document.querySelector(
    ".blur-radius .radius"
  ).innerHTML = document.querySelector(".blur-radius input").value;
  
  if (image.width * image.height > 3000 * 3000) {
    alert("Please note that very big images like this one could possibly lead to your browser tab freezing or out of memory errors, especially on a mobile or low-spec device")
  }
}

/**
 * Displays an `RGBImage` in a given container
 *
 * ---
 * @param {RGBImage} image Image to be displayed
 * @param {String} container_name CSS selector of the container in which the image will be displayed
 */
function displayImage(image, container_name) {
  let { width, height } = image;

  let start = Date.now();

  let container = document.querySelector(container_name);
  container.innerHTML = "";

  let canvas = elt("canvas", {
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

function performBlurring() {
  let radius = Number(document.querySelector(".blur-radius input").value);

  if (radius == 0) {
    displayImage(loadedImage, ".main-img-cont");
  } else {
    let options = document.querySelectorAll('input[type="radio"]');
    let selected = Array.from(options).find((elt) => elt.checked == true);

    if (!selected) {
      alert("No algorithm selected");
      return;
    }

    selected = selected.value;

    if (selected == "box") {
      if (
        !confirmedBasicBox &&
        !confirm(
          "⚠ WARNING:\nThe Basic box blur can be so slow that it could freeze your browser tab. \nAre you sure you want to continue?"
        )
      ) {
        return;
      } else {
        confirmedBasicBox = true;
      }
    }

    let start = Date.now();

    document.querySelector('input[type="range"]').disabled = true;
    document.querySelector(".load-anim").style.display = "flex";

    let finishedWorkers = 0;
    let result = {};
    const bands = ["red", "blue", "green"];

    for (let index of [0, 1, 2]) {
      let closure = (event) => {
        finishedWorkers++;
        result[bands[index]] = new Uint8ClampedArray(event.data);

        if (finishedWorkers == 3) {
          let elapsed = (Date.now() - start) / 1000;

          document.querySelector("section.time-taken strong").innerText =
            elapsed + "s";

          let blurredImage = new RGBImage(
            result.red,
            result.green,
            result.blue,
            loadedImage.width,
            loadedImage.height
          );

          displayImage(blurredImage, ".main-img-cont");
          document.querySelector('input[type="range"]').disabled = false;
          document.querySelector(".load-anim").style.display = "none"

        }

        webWorkers[index].removeEventListener("message", closure);
      };
      webWorkers[index].addEventListener("message", closure);
      webWorkers[index].postMessage({
        band: loadedImage[bands[index]],
        width: loadedImage.width,
        height: loadedImage.height,
        radius,
        selected,
      });
    }
  }
}

function saveImage() {
  let canvas = document.querySelector(".main-img-cont canvas");

  let link = elt("a", {
    href: canvas.toDataURL(),
    download: "Blurred image.png",
  });

  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * A helper function that creates and returns an HTML Element
 *
 * ---
 * @param {String} type Type of `HTMLElement` to be created
 * @param {Object} props Optional properties of the `HTMLElement` to be created
 * @param  {...HTMLElement} children Optional HTML Elements to be assigned as children of this element
 *
 * ---
 * @returns {HTMLElement} An `HTMLElement` object
 */
function elt(type, props, ...children) {
  if (!type) throw new TypeError("Empty HTMLElement type: " + type);
  let dom = document.createElement(type);
  if (props) Object.assign(dom, props);
  for (let child of children) {
    if (typeof child != "string") dom.appendChild(child);
    else dom.appendChild(document.createTextNode(child));
  }
  return dom;
}
