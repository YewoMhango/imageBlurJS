// This computes a false Gaussian blur using three passes of a 
// box blur. For more information check out the link below:
//  - http://blog.ivank.net/fastest-gaussian-blur.html

/**
 * Computes a Gaussian blur using three passes of a box blur 
 * 
 * ---
 * @param {RGBImage} image Image to be blurred
 * @param {"red" | "blue" | "green"} band Image band/channel to blur
 * @param {Number} radius Blur radius
 *
 * ---
 * @returns {RGBImage} A blurred image
 */
function fauxGaussianBlur(image, band, radius) {
  return multipliedBoxBlur(
    multipliedBoxBlur(
      multipliedBoxBlur(image, band, radius),
      band,
      radius
    ),
    band,
    radius
  );
}