# ForeFire in WebAssembly

Compiles the engine to WebAssembly so a simulation can run in a browser tab or
under Node, with no server ([#171](https://github.com/forefireAPI/forefire/issues/171)).
Experimental, not a supported build.

It relies on `FOREFIRE_ENABLE_NETCDF=OFF` (the `FF_NO_NETCDF` guard): NetCDF
was the only thing in `src/` that did not compile under Emscripten. MPI is
already behind `MPI_COUPLING`, and the termios CLI shell is not built.

## Building

Needs [Emscripten](https://emscripten.org) (tested with emsdk 6.0.6):

```sh
emcmake cmake -S . -B build-wasm -DCMAKE_BUILD_TYPE=Release
cmake --build build-wasm -j8
```

`emcmake` sets `EMSCRIPTEN`, which turns off NetCDF, MPI, the Python module,
the tests and the CLI shell, and turns on `forefire_wasm`. Outputs in `bin/`:

| File | Size | gzip |
| --- | --- | --- |
| `forefire.wasm` | 990 KB | 298 KB |
| `forefire.mjs` | 131 KB | 33 KB |

## Testing

```sh
node bindings/wasm/smoke.mjs bin/forefire.mjs
```

`smoke.mjs` is a port of the worked example in
[Running from NumPy arrays](../../docs/source/user_guide/python_arrays.rst).
It gives the same front as the Python binding built from the same tree:
349 nodes, x 1980..3905, y 1763..2308.

## The API

`forefire.mjs` is an ES module exporting a `createForeFire()` factory. It
mirrors the pybind11 module, with typed arrays in place of NumPy arrays:

```js
import createForeFire from "./forefire.mjs";

const Module = await createForeFire();
const ff = new Module.ForeFire();

ff.setString("propagationModel", "WindDriven");
ff.execute("FireDomain[sw=(0,0,0);ne=(4000,4000,0);t=0]");
ff.addLayer("propagation", "WindDriven", "propagationModel");
ff.addIndexLayer("table", "fuel", 0, 0, 0, 4000, 4000, 0, 200, 200, 1, 1, fuelArray);
ff.execute("startFire[loc=(2000,2000,0.);t=0]");
ff.execute("step[dt=30]");
const front = ff.execute("print[]");
```

The layer methods take `nx, ny, nz, nt` explicitly, where NumPy reads them off
the shape. Pass a flat C-order `(t, z, y, x)` array; the binding reorders it
for the data layers, as `_pyforefire.cpp` does.

## Known limits

- **One simulation per module instance.** The session lives in static state
  (#175), so a second `new Module.ForeFire()` in the same instance still sees
  the first fire. To run several, call `createForeFire()` again (reusing a
  compiled `WebAssembly.Module` keeps that to a few milliseconds).
- **Single-threaded.** Threads would need `SharedArrayBuffer` and COOP/COEP
  headers.
- **Arrays only.** No NetCDF landscape files; `FS` is exported to stage
  `fuels.csv` or read what `print[<file>]` writes.
- `forefire_wasm.cpp` is C++17 (embind requires it); the core is unchanged.
