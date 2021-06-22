cargo build --target wasm32-unknown-unknown --release
wasm-strip target\wasm32-unknown-unknown\release\blur.wasm
wasm-opt -o ..\blur.wasm -Oz target\wasm32-unknown-unknown\release\blur.wasm