## What's Changed

### ✨ Features

- feat: add runOnce configuration option for events to execute scripts only once (#4)
- feat: pass showToast to all saveToFile calls (#4)
- feat: implement startup toast with timing improvements (#3)
- feat(toast): add plugin status parsing and toast display (#3)

### 🐛 Fixes

- fix: show toast on saveToFile errors (#4)
- fix: convert to async file reads in toast-silence-detector.ts (#4)
- fix: add shell metacharacter sanitization in run-script.ts (#4)
- fix: resolve race condition in toast-queue.ts with async lock (#4)
- fix: prevent memory leak in opencode-hooks.ts nested timer (#4)

### 📚 Documentation

- docs: update plans and archive completed plans (#4)
- docs: add active plugins toast implementation plan (#3)
- docs: refactor AGENTS.md with split agent instructions (#3)

### ♻️ Internal

- chore: merge feat/run-once (#4)
- chore: merge feat/active-plugins-toast (#3)
- chore: improve queue backpressure handling

**Full Changelog**: https://github.com/johnatas-henrique/opencode-hooks/compare/v0.1.0...v0.2.0
