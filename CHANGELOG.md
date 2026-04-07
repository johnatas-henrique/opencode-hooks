# Changelog

## [0.3.0](https://github.com/johnatas-henrique/opencode-hooks/compare/opencode-hooks-v0.2.0...opencode-hooks-v0.3.0) (2026-04-07)


### Features

* **events:** add TOOL_EXECUTE_AFTER_SUBAGENT event type ([056f965](https://github.com/johnatas-henrique/opencode-hooks/commit/056f965dd5eba5c924136330763b329b7c90ed1b))
* **scripts:** add log-skill.sh script ([f2d3e66](https://github.com/johnatas-henrique/opencode-hooks/commit/f2d3e664ba4617c3529bddaeadc8e36996a18025))


### Bug Fixes

* add sanitization for sensitive data in debug logs ([bbbd9e5](https://github.com/johnatas-henrique/opencode-hooks/commit/bbbd9e5aaec9eec53f316d1f6e9aff7d34f2cc3c))
* **events:** disable unconfigured events to silence warnings ([d955558](https://github.com/johnatas-henrique/opencode-hooks/commit/d955558c90d8df49dfdd21234e9a98d455a87892))


### Maintenance

* remove old type files after rename ([986e5dc](https://github.com/johnatas-henrique/opencode-hooks/commit/986e5dc7c586f5cebd92cb53069d832706b3c2a2))

## [0.2.0](https://github.com/johnatas-henrique/opencode-hooks/compare/opencode-hooks-v0.1.0...opencode-hooks-v0.2.0) (2026-04-06)


### Features

* add auto-assign workflow to assign PR author ([52a0a34](https://github.com/johnatas-henrique/opencode-hooks/commit/52a0a344ed33465f82aa3e2c5309fa88f4beab6e))
* add CI workflow running on every PR ([7eb6ce9](https://github.com/johnatas-henrique/opencode-hooks/commit/7eb6ce9a6f8115318c021ee01918a7f1647ddfc6))
* add commit validation with Husky, Commitlint and lint-staged ([2fd77e6](https://github.com/johnatas-henrique/opencode-hooks/commit/2fd77e62897dca9a4709823fab19a5c021f1bbc2))
* add detect-gaps and server-connected scripts ([6a7ae0d](https://github.com/johnatas-henrique/opencode-hooks/commit/6a7ae0d891f63c5ce112782e55a206499ba7a708))
* add event config loader module with cascading fallback ([33063dc](https://github.com/johnatas-henrique/opencode-hooks/commit/33063dce0b5540356aca52124a87d18e252dfbbb))
* add event configuration JSON file for toggle system ([6603a19](https://github.com/johnatas-henrique/opencode-hooks/commit/6603a1965d6aa50b85a2e5ce9c099595678074e3))
* add helper modules for script execution and file operations ([22e4e80](https://github.com/johnatas-henrique/opencode-hooks/commit/22e4e80c4e6264ce9d5b156d3c318a86f15cc503))
* add logEventConfig and logScriptOutput helpers ([e6526e1](https://github.com/johnatas-henrique/opencode-hooks/commit/e6526e15aec6f090de8d87e770888cfa6b9d8a8e))
* add message.part.delta handler ([3834c10](https://github.com/johnatas-henrique/opencode-hooks/commit/3834c10488860e51a686116702360010559cc6f5))
* add modular event system with 28 OpenCode event handlers ([1961c0a](https://github.com/johnatas-henrique/opencode-hooks/commit/1961c0a2ccf5b59304ccc744c1a26ff0cb7036ee))
* add project infrastructure with dependencies ([f0a60b8](https://github.com/johnatas-henrique/opencode-hooks/commit/f0a60b8baa3a4f47de816cc273424f492a15b21a))
* add runOnce configuration option for events to execute scripts only once ([2aa2875](https://github.com/johnatas-henrique/opencode-hooks/commit/2aa2875138c6834dc083daf6ac3ec30bd76017ed))
* add session lifecycle shell scripts ([4629b2e](https://github.com/johnatas-henrique/opencode-hooks/commit/4629b2e5ff1e3c7beadb4c2a1bb97fb031cc4d34))
* add session tracking and runScriptConfig types ([d380333](https://github.com/johnatas-henrique/opencode-hooks/commit/d380333d0c0ea5664ea11eb3c96c0629023e5291))
* add toast queue implementation to prevent overlap ([1966027](https://github.com/johnatas-henrique/opencode-hooks/commit/19660271efa2c62888ddf860d3585e13da93e996))
* add toast.enabled flag for custom config without showing toast ([68e7248](https://github.com/johnatas-henrique/opencode-hooks/commit/68e7248915daefabe53d16f5218359a8435cb599))
* add validation shell scripts for git hooks ([0591cdd](https://github.com/johnatas-henrique/opencode-hooks/commit/0591cdd170f3e60b56c07f33893fe32c1064e2df))
* extract showStartupToast to helpers ([3f7b367](https://github.com/johnatas-henrique/opencode-hooks/commit/3f7b367022bafb8944f2c824fe4d10adec55e43c))
* implement event toggle system in plugin ([9357e60](https://github.com/johnatas-henrique/opencode-hooks/commit/9357e60caa4b9267fdc2921ff7714ca2b4c953e1))
* **opencode-hooks:** implement startup toast with timing improvements ([b70387c](https://github.com/johnatas-henrique/opencode-hooks/commit/b70387cf35027526da2941e7a926e4abd7183800))
* pass showToast to all saveToFile calls ([28537e1](https://github.com/johnatas-henrique/opencode-hooks/commit/28537e115daeb2b8e571a88e090f2b7ec470aaba))
* **toast:** add plugin status parsing and toast display ([fb793fa](https://github.com/johnatas-henrique/opencode-hooks/commit/fb793fab824e0ecdd025ad63122e02607a922618))


### Bug Fixes

* add enabled merge in resolveToolConfig ([0e587e2](https://github.com/johnatas-henrique/opencode-hooks/commit/0e587e2f83298a405daf322b6d134beef6213197))
* add release-as to workflow to force 0.1.0 version ([3413274](https://github.com/johnatas-henrique/opencode-hooks/commit/34132744b6be99bb8833b51a80050c01d645e5e1))
* add saveToFile flag for script output logging ([6610245](https://github.com/johnatas-henrique/opencode-hooks/commit/6610245099cebec5c95553e89e31999349bfc59f))
* add shell metacharacter sanitization in run-script.ts ([54ad97a](https://github.com/johnatas-henrique/opencode-hooks/commit/54ad97ad9c5de8ed365299131bb26509b7ce8f6d))
* block runOnce scripts in subagent sessions ([b0e23c0](https://github.com/johnatas-henrique/opencode-hooks/commit/b0e23c0c76d5fc3e37d9189085772300344f2d13))
* change module to es2022 to resolve node types ([9ab3883](https://github.com/johnatas-henrique/opencode-hooks/commit/9ab38837fdd55ca2740cdda0f4394c7acc122376))
* change test:ci to test:cov in CI workflow ([94a77dd](https://github.com/johnatas-henrique/opencode-hooks/commit/94a77dd8a73a3d52950b9cc07b1eee9a9fabe0b2))
* configure Release Please for 0.x.x versioning ([f84fab4](https://github.com/johnatas-henrique/opencode-hooks/commit/f84fab44a84c22fcf8aa12312c832ab5ad1b002a))
* configure release-please for 0.x.x versioning ([f7fbbb0](https://github.com/johnatas-henrique/opencode-hooks/commit/f7fbbb0c1fdad5e88cc9a9bf753ebc8bc79a3da5))
* configure release-please for 0.x.x versioning ([d6bfd16](https://github.com/johnatas-henrique/opencode-hooks/commit/d6bfd16140d86627ef812ac2703de79839ac0c0a))
* convert to async file reads in toast-silence-detector.ts ([c115333](https://github.com/johnatas-henrique/opencode-hooks/commit/c115333f31070c650f876ba0dc3327356d782d7f))
* immutability pattern and memory leak ([6b3150f](https://github.com/johnatas-henrique/opencode-hooks/commit/6b3150f3ffab6ac033c474675f9b0fa15b4326c2))
* improve error handling and remove TUI-impacting console calls ([a0a1310](https://github.com/johnatas-henrique/opencode-hooks/commit/a0a131087975b1e48f3f7137f84e4bf1e0e58f9e))
* prevent memory leak in opencode-hooks.ts nested timer ([f90f9bc](https://github.com/johnatas-henrique/opencode-hooks/commit/f90f9bc472696a2f615e581acffc47a69c042279))
* rename session scripts and fix no-commits error ([0558046](https://github.com/johnatas-henrique/opencode-hooks/commit/0558046b5dfbed019f82e3363ebf483de70bd0c6))
* resolve code review critical issues and warnings ([e265cb2](https://github.com/johnatas-henrique/opencode-hooks/commit/e265cb260b9fac443658ddf4d5ac35fa8f4e5cba))
* resolve PluginInput and callable expression type errors ([67cdfe8](https://github.com/johnatas-henrique/opencode-hooks/commit/67cdfe84ad5fb7fd7a0c84a902425cf4a572f58f))
* resolve race condition in toast-queue.ts with async lock ([48533d2](https://github.com/johnatas-henrique/opencode-hooks/commit/48533d270ad371cd9a79bb4f0f186307dff5ecc2))
* resolve test tsconfig errors and add ambient type declarations ([a852181](https://github.com/johnatas-henrique/opencode-hooks/commit/a852181853fe74a85b98b3e55ae543bd83f4f1a5))
* restore THIRTY_SECONDS constant usage ([3be4eb1](https://github.com/johnatas-henrique/opencode-hooks/commit/3be4eb112f4e233ff56f997672c9c81d74ddaa6a))
* set sensible default title for server.instance.disposed ([be4603a](https://github.com/johnatas-henrique/opencode-hooks/commit/be4603abdf298694c91e836a18f00862d4672e10))
* show toast on saveToFile errors ([5e6244d](https://github.com/johnatas-henrique/opencode-hooks/commit/5e6244df2fa2b79577871a63281adee239b6b20d))
* skip unknown event warning for tool events ([f699203](https://github.com/johnatas-henrique/opencode-hooks/commit/f699203165e29fab28d245420e8cc588b5f5d40c))
* update save-to-file tests to match actual implementation ([7bc671c](https://github.com/johnatas-henrique/opencode-hooks/commit/7bc671c767d22ae6d8828f4b0ee4b25cc398f41e))
* update version to 0.1.0 and fix Release Please permissions ([94e44ed](https://github.com/johnatas-henrique/opencode-hooks/commit/94e44ed879e7ad45501d6f30d89128a786f6fc1d))
* use explicit UTC date format in session-closed.sh ([4cff6e3](https://github.com/johnatas-henrique/opencode-hooks/commit/4cff6e33c254be0075280fd61a074f11cdbdef6c))


### Performance Improvements

* fix performance issues identified by optimizer ([ec45a57](https://github.com/johnatas-henrique/opencode-hooks/commit/ec45a579324e0eb8f672890db860a54a68ebceba))


### Maintenance

* add .editorconfig for consistent editor settings ([cb8b365](https://github.com/johnatas-henrique/opencode-hooks/commit/cb8b36538efa07159043fb61649434b665545eca))
* add codecov.yml and update .npmignore ([e14aa1f](https://github.com/johnatas-henrique/opencode-hooks/commit/e14aa1fb041f2f553f147880e985dbba30354e2d))
* add CODEOWNERS and SECURITY.md files ([af320a7](https://github.com/johnatas-henrique/opencode-hooks/commit/af320a73ba408e9f5e600bee11fc553df6dbe134))
* add GitHub issue and PR templates ([30b8224](https://github.com/johnatas-henrique/opencode-hooks/commit/30b8224ea5fc09c53dda024f00d3a1334ab57c6d))
* add npm and git ignores ([c81048d](https://github.com/johnatas-henrique/opencode-hooks/commit/c81048d794fcbbb3d4db933e7b35bfcffa68ce9c))
* add opencode configuration files ([205796f](https://github.com/johnatas-henrique/opencode-hooks/commit/205796f10dd2eccc02bdbe953d5fae65ac2bdcc3))
* add TypeScript and ESLint configuration ([0d418df](https://github.com/johnatas-henrique/opencode-hooks/commit/0d418df9565047933271b6c88736c0fea1cd4bd0))
* archive old plans ([c30ded2](https://github.com/johnatas-henrique/opencode-hooks/commit/c30ded2ea3672ff4b0f56c92dae71278b71eeea0))
* change release-please JSON ([d7e1232](https://github.com/johnatas-henrique/opencode-hooks/commit/d7e1232b16a19730e71f1f0e54516c8e6ae1add5))
* configure ESLint and Prettier for code quality ([ce2d697](https://github.com/johnatas-henrique/opencode-hooks/commit/ce2d697f84ce20b7571d4d55e18eb12d3fcf25eb))
* fix ESLint errors and run Prettier ([d5c321c](https://github.com/johnatas-henrique/opencode-hooks/commit/d5c321c4a2589a6098dc24dbfb0d37e606c964cb))
* **main:** release 0.1.0 ([bf41eba](https://github.com/johnatas-henrique/opencode-hooks/commit/bf41eba7c20486e5eb1437a88b87f5e154161c7a))
* professional project setup with Release Please workflow ([c12787d](https://github.com/johnatas-henrique/opencode-hooks/commit/c12787d099de7a8c9d67bfbf8ee5ff1d34ae3503))
* remove legacy events-config system ([a05e98e](https://github.com/johnatas-henrique/opencode-hooks/commit/a05e98e41a20a2ed1e322d93d82ec4bf6653b813))
* simplify test scripts and remove test:unit ([61f6f16](https://github.com/johnatas-henrique/opencode-hooks/commit/61f6f161e539a0d21bbdac62b6ac3ef65e3cd463))
* **tests:** remove forceExit from Jest scripts ([2391b7a](https://github.com/johnatas-henrique/opencode-hooks/commit/2391b7adefee30e26b0fae341acff9673a9ae0ef))
* **toast:** improve queue backpressure handling ([4df1ea4](https://github.com/johnatas-henrique/opencode-hooks/commit/4df1ea4f00251520a6118319ca22d8df95ca6f87))
* update AGENTS.md ([4aabd64](https://github.com/johnatas-henrique/opencode-hooks/commit/4aabd64ce33f76869c51b71add6ee8b6f1e13a61))
* update package-lock.json ([a15c0f7](https://github.com/johnatas-henrique/opencode-hooks/commit/a15c0f7b2b61133314d484fce2afd85556f3a9c9))
* update package.json and package-lock.json ([aee543c](https://github.com/johnatas-henrique/opencode-hooks/commit/aee543c29f2a63008ad5ef82d7c8c4c829b2e1d9))
* update project configuration files ([cdc98c6](https://github.com/johnatas-henrique/opencode-hooks/commit/cdc98c688ae2e31488c3d7764c2cc18d3af0bc27))
* update user-events.config.ts with production defaults ([eed5857](https://github.com/johnatas-henrique/opencode-hooks/commit/eed5857052c73f6028ec172826f91b1322445be7))

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
