/**
 * A representation of an RGB Image. I chose to create a
 * special class so that each color band could be stored in
 * a separate Array to simplify the blurring code.
 */
export default class RGBImage {
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
