# Fast Image Blurring with Javascript

This is a simple, browser-based image blurring program with all the processing done purely in client-side Javascript. It uses boxblur and stackblur algorithms, and each algorithm has multiple implementations, of differing speeds. For further reading on how the algorithms work, check out the [references](#references). 

It is not necessarily meant to be a standalone web app but rather to test and demonstrate the possibility of blurring images in the browser and the optimizations that can be done along the way. You are free to use it to develop your own programs.

## Usage

You can check out a live version of this project on my personal Github page [here](https://yewomhango.github.io/imageBlurJS/). To use it, follow these steps:

  1. Click on `Load an Image` to load an image into the program
  2. Select one of the eight algorithms to run it on the image.

**Please note that the `Basic Box Blur` is so slow that it can cause your browser to freeze, especially for higher blur radius values and for bigger images. It is mainly there to demonstrate how poorly a naive implementation can perform. Ideally, you should only use it with a small blur radius, and the image shouldn't be too big.**

  3. Move the slider to change the blur radius and see the resulting image
  4. You can change the radius multiple times and switch between different algorithms to compare
  5. You can download the blurred image by clicking on the button that appears at its top-right corner when you hover on it

## References

  1. [How to Blur an Image on Android](https://medium.com/mobile-app-development-publication/blurring-image-algorithm-example-in-android-cec81911cd5e)
  2. [Stackblur (2004)](https://underdestruction.com/2004/02/25/stackblur-2004/)
  3. [Stackblur and Quadratic Stackblur](https://observablehq.com/@jobleonard/mario-klingemans-stackblur)
  4. [Fastest Gaussian Blur](http://blog.ivank.net/fastest-gaussian-blur.html)
