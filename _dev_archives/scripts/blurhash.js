// Fallback Blurhash Decoder Stub
// Prevents "blurhash is not defined" or 404 Not Found errors on the Command Center due to COEP blocks.

window.blurhash = {
    decode: function (blurhash, width, height) {
        console.warn("⚠️ [Blurhash Fallback] Decode called, but core library is stubbed. Returning transparent pixel array.");
        // Return a dummy Uint8ClampedArray to prevent Canvas/Image processing crashes
        return new Uint8ClampedArray(width * height * 4);
    },
    encode: function () {
        console.warn("⚠️ [Blurhash Fallback] Encode called, but core library is stubbed.");
        return "";
    }
};
