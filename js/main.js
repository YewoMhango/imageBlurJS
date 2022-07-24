import { create } from "./create.js";
import { displayImage } from "./displayImage.js";
import RGBImage from "./RGBImage.js";
import { finishLoad } from "./imageLoader.js";

/**
 * A global variable representing the original image loaded by the user
 */
export let loadedImage;
/**
 * Is true when a user has confirmed that they are sure they want to use the slow basic box blur
 */
let confirmedToUseBasicBoxBlur = false;
/**
 * Is true when a user has confirmed that they are sure they want to use the optimized box blur
 */
let confirmedToUseOptimizedBoxBlur = false;

/**
 * An array of web workers for performing the processing in parallel
 */
let webWorkers = [
  new Worker("./js/algorithms/blurWorker.js"),
  new Worker("./js/algorithms/blurWorker.js"),
  new Worker("./js/algorithms/blurWorker.js"),
];

for (let worker of webWorkers) {
  worker.addEventListener("error", (e) => {
    alert(e.message);
    document.querySelector('input[type="range"]').disabled = false;
    document.querySelector(".image").removeAttribute("loading");
  });
}

/**
 * @param {RGBImage} image
 */
export function setLoadedImage(image) {
  loadedImage = image;
}

/**
 * Responds to the `onchange` event on the radius slider
 */
document.querySelector(".radius-slider").onclick = function radiusChanged() {
  document.querySelector(".blur-radius span.radius").innerHTML =
    document.querySelector(".blur-radius input").value;
  try {
    performBlurring();
  } catch (e) {
    document.querySelector('input[type="range"]').disabled = false;
    document.querySelector(".image").removeAttribute("loading");
    alert(e.message);
  }
};

/**
 * Starts the process of loading an image when the `Input a file` button is clicked
 */
document.querySelector(".load-image").onclick = function startLoad() {
  let input = create("input", {
    type: "file",
    onchange: () => finishLoad(input.files[0]),
    accept: "image/*",
  });
  document.body.appendChild(input);
  input.click();
  input.remove();
};

/**
 * Allow user to download image
 */
document.querySelector(".save-image-button").onclick = function saveImage() {
  let canvas = document.querySelector(".main-img-cont canvas");

  let link = create("a", {
    href: canvas.toDataURL(),
    download: "Blurred image.png",
  });

  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * Performs the actual blurring
 */
function performBlurring() {
  let radius = Number(document.querySelector(".blur-radius input").value);

  if (radius == 0) {
    displayImage(loadedImage);
  } else {
    let { selected, abort } = getSelectedAlgorithm();

    if (abort) {
      return;
    }

    let startTime = Date.now(); // Time counter

    document.querySelector('input[type="range"]').disabled = true;
    document.querySelector(".image").setAttribute("loading", "true");

    let finishedWorkers = 0;
    let result = {};
    const bands = ["red", "blue", "green"];

    for (let index of [0, 1, 2]) {
      webWorkers[index].addEventListener("message", function closure(event) {
        finishedWorkers++;
        result[bands[index]] = new Uint8ClampedArray(event.data);

        if (finishedWorkers == 3) {
          displayResult(startTime, result);
        }

        webWorkers[index].removeEventListener("message", closure);
      });

      webWorkers[index].postMessage({
        band: loadedImage[bands[index]],
        width: loadedImage.width,
        height: loadedImage.height,
        radius,
        selected,
      });
    }
  }

  /**
   * @param {number} startTime Starting point of timer
   * @param {{red: Uint8ClampedArray, green: Uint8ClampedArray, blue: Uint8ClampedArray}} result The resulting image to display
   */
  function displayResult(startTime, result) {
    let elapsedTime = (Date.now() - startTime) / 1000;

    document.querySelector("section.time-taken strong").innerText =
      elapsedTime + "s";

    let blurredImage = new RGBImage(
      result.red,
      result.green,
      result.blue,
      loadedImage.width,
      loadedImage.height
    );

    displayImage(blurredImage);
    document.querySelector('input[type="range"]').disabled = false;
    document.querySelector(".image").removeAttribute("loading");
  }
}

/**
 * @returns {{selected: string, abort: boolean }}
 */
function getSelectedAlgorithm() {
  let options = document.querySelectorAll('input[type="radio"]');
  let selectedElement = Array.from(options).find(
    (element) => element.checked == true
  );

  if (!selectedElement) {
    alert("No algorithm selected");
    return;
  }

  let selected = selectedElement.value;

  if (selected == "box") {
    if (
      !confirmedToUseBasicBoxBlur &&
      !confirm(
        "⚠ WARNING:\nThe Basic box blur can be so slow that it could freeze your browser tab. \nAre you sure you want to continue?"
      )
    ) {
      return { abort: true, selected };
    } else {
      confirmedToUseBasicBoxBlur = true;
    }
  }

  if (selected == "box2") {
    if (
      !confirmedToUseOptimizedBoxBlur &&
      loadedImage.width * loadedImage.height > 1080 * 1080 &&
      !confirm(
        '⚠ WARNING:\nThe "optimized box blur" can sometimes lead to out of memory exceptions, especially with big images like this one and on a mobile or low-spec device. \nAre you sure you want to continue?'
      )
    ) {
      return { abort: true, selected };
    } else {
      confirmedToUseOptimizedBoxBlur = true;
    }
  }

  return { selected, abort: false };
}
