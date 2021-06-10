// This computes a false Gaussian blur using three passes of a 
// box blur. For more information check out the link below:
//  - http://blog.ivank.net/fastest-gaussian-blur.html
// I ended up choosing `furtherOptimizedBoxBlur` over `multipliedBoxBlur`
// since the distortion of `multipliedBoxBlur` tend
// to get exacerbated when it gets used in multiple passes
// on an image

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
  return furtherOptimizedBoxBlur(
    furtherOptimizedBoxBlur(
      furtherOptimizedBoxBlur(image, band, radius),
      band,
      radius
    ),
    band,
    radius
  );
}