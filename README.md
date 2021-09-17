# Fast Image Blurring with Javascript 

This is a simple, browser-based image blurring program with all the processing done purely in client-side Javascript and WebAssembly. For further reading on how the algorithms work, refer to the [references](#references). 

## Usage

You can check out a live version [here](https://yewomhango.github.io/imageBlurJS)

  1. Click on `Load an Image` to load an image
  2. Select one of the algorithms.

**Please note that the `Basic Box Blur` is so slow that it can cause your browser to freeze, especially for higher blur radius values and for bigger images. It is mainly there to demonstrate how poorly a naive implementation can perform. Ideally, you should only use it with a small blur radius, and the image shouldn't be too big.**

  3. Move the slider to change the blur radius and see the resulting image
  4. You can change the radius multiple times and switch between different algorithms to compare
  5. You can download the blurred image by clicking on the button that appears at its top-right corner when you hover on it

## References

  1. [How to Blur an Image on Android](https://medium.com/mobile-app-development-publication/blurring-image-algorithm-example-in-android-cec81911cd5e)
  2. [Stackblur (2004)](https://underdestruction.com/2004/02/25/stackblur-2004/)
  3. [Stackblur and Quadratic Stackblur](https://observablehq.com/@jobleonard/mario-klingemans-stackblur)
  4. [Fastest Gaussian Blur](http://blog.ivank.net/fastest-gaussian-blur.html)
