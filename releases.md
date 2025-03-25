# Body Releases

## 1.2.0
- Moved generated .js and .d.ts files into lib/ instead of build/, this changes the "main" from "build/index.js" to "lib/index.js".
- Removed `xhr2` from the project and replaced `XMLHttpRequest` with `fetch`.
- Removed `xhr` from `onRequestedStruct` and `onRequestingStruct`.
- Removed `Body.verbose_on()` and `Body.verbose_off()` functions and all references to `this.verbose` as well as all `console.log` calls.
- Added `domain` and `on` functions to `Service` class, each passes their arguments to, and returns from, the `body` function of the same name.
- Changed `body.domain` to getter/setter instead of just setter.