# Changelog

## [0.1.0](https://github.com/johnatas-henrique/opencode-hooks/compare/v0.1.0...v0.1.0) (2026-04-05)


### Features

* add auto-assign workflow to assign PR author ([52a0a34](https://github.com/johnatas-henrique/opencode-hooks/commit/52a0a344ed33465f82aa3e2c5309fa88f4beab6e))
* add CI workflow running on every PR ([7eb6ce9](https://github.com/johnatas-henrique/opencode-hooks/commit/7eb6ce9a6f8115318c021ee01918a7f1647ddfc6))
* add commit validation with Husky, Commitlint and lint-staged ([2fd77e6](https://github.com/johnatas-henrique/opencode-hooks/commit/2fd77e62897dca9a4709823fab19a5c021f1bbc2))
* add detect-gaps and server-connected scripts ([6a7ae0d](https://github.com/johnatas-henrique/opencode-hooks/commit/6a7ae0d891f63c5ce112782e55a206499ba7a708))
* add event config loader module with cascading fallback ([33063dc](https://github.com/johnatas-henrique/opencode-hooks/commit/33063dce0b5540356aca52124a87d18e252dfbbb))
* add event configuration JSON file for toggle system ([6603a19](https://github.com/johnatas-henrique/opencode-hooks/commit/6603a1965d6aa50b85a2e5ce9c099595678074e3))
* add helper modules for script execution and file operations ([22e4e80](https://github.com/johnatas-henrique/opencode-hooks/commit/22e4e80c4e6264ce9d5b156d3c318a86f15cc503))
* add modular event system with 28 OpenCode event handlers ([1961c0a](https://github.com/johnatas-henrique/opencode-hooks/commit/1961c0a2ccf5b59304ccc744c1a26ff0cb7036ee))
* add project infrastructure with dependencies ([f0a60b8](https://github.com/johnatas-henrique/opencode-hooks/commit/f0a60b8baa3a4f47de816cc273424f492a15b21a))
* add runOnce configuration option for events to execute scripts only once ([2aa2875](https://github.com/johnatas-henrique/opencode-hooks/commit/2aa2875138c6834dc083daf6ac3ec30bd76017ed))
* add session lifecycle shell scripts ([4629b2e](https://github.com/johnatas-henrique/opencode-hooks/commit/4629b2e5ff1e3c7beadb4c2a1bb97fb031cc4d34))
* add toast queue implementation to prevent overlap ([1966027](https://github.com/johnatas-henrique/opencode-hooks/commit/19660271efa2c62888ddf860d3585e13da93e996))
* add toast.enabled flag for custom config without showing toast ([68e7248](https://github.com/johnatas-henrique/opencode-hooks/commit/68e7248915daefabe53d16f5218359a8435cb599))
* add validation shell scripts for git hooks ([0591cdd](https://github.com/johnatas-henrique/opencode-hooks/commit/0591cdd170f3e60b56c07f33893fe32c1064e2df))
* implement event toggle system in plugin ([9357e60](https://github.com/johnatas-henrique/opencode-hooks/commit/9357e60caa4b9267fdc2921ff7714ca2b4c953e1))
* **opencode-hooks:** implement startup toast with timing improvements ([b70387c](https://github.com/johnatas-henrique/opencode-hooks/commit/b70387cf35027526da2941e7a926e4abd7183800))
* pass showToast to all saveToFile calls ([28537e1](https://github.com/johnatas-henrique/opencode-hooks/commit/28537e115daeb2b8e571a88e090f2b7ec470aaba))
* **toast:** add plugin status parsing and toast display ([fb793fa](https://github.com/johnatas-henrique/opencode-hooks/commit/fb793fab824e0ecdd025ad63122e02607a922618))


### Bug Fixes

* add release-as to workflow to force 0.1.0 version ([3413274](https://github.com/johnatas-henrique/opencode-hooks/commit/34132744b6be99bb8833b51a80050c01d645e5e1))
* add saveToFile flag for script output logging ([6610245](https://github.com/johnatas-henrique/opencode-hooks/commit/6610245099cebec5c95553e89e31999349bfc59f))
* add shell metacharacter sanitization in run-script.ts ([54ad97a](https://github.com/johnatas-henrique/opencode-hooks/commit/54ad97ad9c5de8ed365299131bb26509b7ce8f6d))
* configure Release Please for 0.x.x versioning ([f84fab4](https://github.com/johnatas-henrique/opencode-hooks/commit/f84fab44a84c22fcf8aa12312c832ab5ad1b002a))
* convert to async file reads in toast-silence-detector.ts ([c115333](https://github.com/johnatas-henrique/opencode-hooks/commit/c115333f31070c650f876ba0dc3327356d782d7f))
* improve error handling and remove TUI-impacting console calls ([a0a1310](https://github.com/johnatas-henrique/opencode-hooks/commit/a0a131087975b1e48f3f7137f84e4bf1e0e58f9e))
* prevent memory leak in opencode-hooks.ts nested timer ([f90f9bc](https://github.com/johnatas-henrique/opencode-hooks/commit/f90f9bc472696a2f615e581acffc47a69c042279))
* rename session scripts and fix no-commits error ([0558046](https://github.com/johnatas-henrique/opencode-hooks/commit/0558046b5dfbed019f82e3363ebf483de70bd0c6))
* resolve code review critical issues and warnings ([e265cb2](https://github.com/johnatas-henrique/opencode-hooks/commit/e265cb260b9fac443658ddf4d5ac35fa8f4e5cba))
* resolve PluginInput and callable expression type errors ([67cdfe8](https://github.com/johnatas-henrique/opencode-hooks/commit/67cdfe84ad5fb7fd7a0c84a902425cf4a572f58f))
* resolve race condition in toast-queue.ts with async lock ([48533d2](https://github.com/johnatas-henrique/opencode-hooks/commit/48533d270ad371cd9a79bb4f0f186307dff5ecc2))
* resolve test tsconfig errors and add ambient type declarations ([a852181](https://github.com/johnatas-henrique/opencode-hooks/commit/a852181853fe74a85b98b3e55ae543bd83f4f1a5))
* set sensible default title for server.instance.disposed ([be4603a](https://github.com/johnatas-henrique/opencode-hooks/commit/be4603abdf298694c91e836a18f00862d4672e10))
* show toast on saveToFile errors ([5e6244d](https://github.com/johnatas-henrique/opencode-hooks/commit/5e6244df2fa2b79577871a63281adee239b6b20d))
* update save-to-file tests to match actual implementation ([7bc671c](https://github.com/johnatas-henrique/opencode-hooks/commit/7bc671c767d22ae6d8828f4b0ee4b25cc398f41e))
* update version to 0.1.0 and fix Release Please permissions ([94e44ed](https://github.com/johnatas-henrique/opencode-hooks/commit/94e44ed879e7ad45501d6f30d89128a786f6fc1d))

## 0.1.0 (2026-04-04)


### Features

* add auto-assign workflow to assign PR author ([52a0a34](https://github.com/johnatas-henrique/opencode-hooks/commit/52a0a344ed33465f82aa3e2c5309fa88f4beab6e))
* add CI workflow running on every PR ([7eb6ce9](https://github.com/johnatas-henrique/opencode-hooks/commit/7eb6ce9a6f8115318c021ee01918a7f1647ddfc6))
* add commit validation with Husky, Commitlint and lint-staged ([2fd77e6](https://github.com/johnatas-henrique/opencode-hooks/commit/2fd77e62897dca9a4709823fab19a5c021f1bbc2))
* add detect-gaps and server-connected scripts ([6a7ae0d](https://github.com/johnatas-henrique/opencode-hooks/commit/6a7ae0d891f63c5ce112782e55a206499ba7a708))
* add event config loader module with cascading fallback ([33063dc](https://github.com/johnatas-henrique/opencode-hooks/commit/33063dce0b5540356aca52124a87d18e252dfbbb))
* add event configuration JSON file for toggle system ([6603a19](https://github.com/johnatas-henrique/opencode-hooks/commit/6603a1965d6aa50b85a2e5ce9c099595678074e3))
* add helper modules for script execution and file operations ([22e4e80](https://github.com/johnatas-henrique/opencode-hooks/commit/22e4e80c4e6264ce9d5b156d3c318a86f15cc503))
* add modular event system with 28 OpenCode event handlers ([1961c0a](https://github.com/johnatas-henrique/opencode-hooks/commit/1961c0a2ccf5b59304ccc744c1a26ff0cb7036ee))
* add project infrastructure with dependencies ([f0a60b8](https://github.com/johnatas-henrique/opencode-hooks/commit/f0a60b8baa3a4f47de816cc273424f492a15b21a))
* add runOnce configuration option for events to execute scripts only once ([2aa2875](https://github.com/johnatas-henrique/opencode-hooks/commit/2aa2875138c6834dc083daf6ac3ec30bd76017ed))
* add session lifecycle shell scripts ([4629b2e](https://github.com/johnatas-henrique/opencode-hooks/commit/4629b2e5ff1e3c7beadb4c2a1bb97fb031cc4d34))
* add toast queue implementation to prevent overlap ([1966027](https://github.com/johnatas-henrique/opencode-hooks/commit/19660271efa2c62888ddf860d3585e13da93e996))
* add toast.enabled flag for custom config without showing toast ([68e7248](https://github.com/johnatas-henrique/opencode-hooks/commit/68e7248915daefabe53d16f5218359a8435cb599))
* add validation shell scripts for git hooks ([0591cdd](https://github.com/johnatas-henrique/opencode-hooks/commit/0591cdd170f3e60b56c07f33893fe32c1064e2df))
* implement event toggle system in plugin ([9357e60](https://github.com/johnatas-henrique/opencode-hooks/commit/9357e60caa4b9267fdc2921ff7714ca2b4c953e1))
* **opencode-hooks:** implement startup toast with timing improvements ([b70387c](https://github.com/johnatas-henrique/opencode-hooks/commit/b70387cf35027526da2941e7a926e4abd7183800))
* pass showToast to all saveToFile calls ([28537e1](https://github.com/johnatas-henrique/opencode-hooks/commit/28537e115daeb2b8e571a88e090f2b7ec470aaba))
* **toast:** add plugin status parsing and toast display ([fb793fa](https://github.com/johnatas-henrique/opencode-hooks/commit/fb793fab824e0ecdd025ad63122e02607a922618))


### Bug Fixes

* add release-as to workflow to force 0.1.0 version ([3413274](https://github.com/johnatas-henrique/opencode-hooks/commit/34132744b6be99bb8833b51a80050c01d645e5e1))
* add saveToFile flag for script output logging ([6610245](https://github.com/johnatas-henrique/opencode-hooks/commit/6610245099cebec5c95553e89e31999349bfc59f))
* add shell metacharacter sanitization in run-script.ts ([54ad97a](https://github.com/johnatas-henrique/opencode-hooks/commit/54ad97ad9c5de8ed365299131bb26509b7ce8f6d))
* configure Release Please for 0.x.x versioning ([f84fab4](https://github.com/johnatas-henrique/opencode-hooks/commit/f84fab44a84c22fcf8aa12312c832ab5ad1b002a))
* convert to async file reads in toast-silence-detector.ts ([c115333](https://github.com/johnatas-henrique/opencode-hooks/commit/c115333f31070c650f876ba0dc3327356d782d7f))
* improve error handling and remove TUI-impacting console calls ([a0a1310](https://github.com/johnatas-henrique/opencode-hooks/commit/a0a131087975b1e48f3f7137f84e4bf1e0e58f9e))
* prevent memory leak in opencode-hooks.ts nested timer ([f90f9bc](https://github.com/johnatas-henrique/opencode-hooks/commit/f90f9bc472696a2f615e581acffc47a69c042279))
* rename session scripts and fix no-commits error ([0558046](https://github.com/johnatas-henrique/opencode-hooks/commit/0558046b5dfbed019f82e3363ebf483de70bd0c6))
* resolve code review critical issues and warnings ([e265cb2](https://github.com/johnatas-henrique/opencode-hooks/commit/e265cb260b9fac443658ddf4d5ac35fa8f4e5cba))
* resolve PluginInput and callable expression type errors ([67cdfe8](https://github.com/johnatas-henrique/opencode-hooks/commit/67cdfe84ad5fb7fd7a0c84a902425cf4a572f58f))
* resolve race condition in toast-queue.ts with async lock ([48533d2](https://github.com/johnatas-henrique/opencode-hooks/commit/48533d270ad371cd9a79bb4f0f186307dff5ecc2))
* resolve test tsconfig errors and add ambient type declarations ([a852181](https://github.com/johnatas-henrique/opencode-hooks/commit/a852181853fe74a85b98b3e55ae543bd83f4f1a5))
* set sensible default title for server.instance.disposed ([be4603a](https://github.com/johnatas-henrique/opencode-hooks/commit/be4603abdf298694c91e836a18f00862d4672e10))
* show toast on saveToFile errors ([5e6244d](https://github.com/johnatas-henrique/opencode-hooks/commit/5e6244df2fa2b79577871a63281adee239b6b20d))
* update save-to-file tests to match actual implementation ([7bc671c](https://github.com/johnatas-henrique/opencode-hooks/commit/7bc671c767d22ae6d8828f4b0ee4b25cc398f41e))
* update version to 0.1.0 and fix Release Please permissions ([94e44ed](https://github.com/johnatas-henrique/opencode-hooks/commit/94e44ed879e7ad45501d6f30d89128a786f6fc1d))
