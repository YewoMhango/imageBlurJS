# WASM Blurring
This part of the project implements some of the same algorithmsbut as before but in WebAssembly with Rust. It uses many of the same techniques given in [this article](http://cliffle.com/blog/bare-metal-wasm/) for minimal dependencies.

## Build Dependencies
To build, it requires you to have Rust installed with the `wasm32-unknown-unknown` target. To install it, just run `rustup target add wasm32-unknown-unknown`. Additionally, you will need to install [wabt](https://github.com/WebAssembly/wabt) and [binaryen](https://github.com/WebAssembly/binaryen) to minimize the size of the resulting WedAssembly files.

## build.cmd
I used the `build.cmd` file as a command-line script to easily run the build process, including compiling and minimizing the resulting WASM binary using `wasm-strip` and `wasm-opt`. You may have to write your own shell script if you want to make changes and are not using Windows and/or Command Prompt.