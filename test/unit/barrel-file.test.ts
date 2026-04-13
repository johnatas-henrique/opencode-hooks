describe('barrel file (index.ts) - re-exports', () => {
  it('should import and call all re-exported functions', async () => {
    const index = await import('../../.opencode/plugins/helpers/index');

    expect(typeof index.saveToFile).toBe('function');
    expect(typeof index.runScript).toBe('function');
    expect(typeof index.runScriptAndHandle).toBe('function');
    expect(typeof index.appendToSession).toBe('function');
    expect(typeof index.handleDebugLog).toBe('function');
    expect(typeof index.showToastStaggered).toBe('function');
    expect(typeof index.createToastQueue).toBe('function');
    expect(typeof index.initGlobalToastQueue).toBe('function');
    expect(typeof index.useGlobalToastQueue).toBe('function');
    expect(typeof index.getGlobalToastQueue).toBe('function');
    expect(typeof index.resetGlobalToastQueue).toBe('function');
    expect(typeof index.handlers).toBe('object');
    expect(typeof index.resolveEventConfig).toBe('function');
    expect(typeof index.resolveToolConfig).toBe('function');
    expect(typeof index.normalizeInputForHandler).toBe('function');
    expect(typeof index.getHandler).toBe('function');
    expect(typeof index.EventType).toBe('object');
    expect(typeof index.showActivePluginsToast).toBe('function');
    expect(typeof index.waitForToastSilence).toBe('function');
    expect(typeof index.countToastsInLog).toBe('function');
    expect(typeof index.showStartupToast).toBe('function');
    expect(typeof index.logEventConfig).toBe('function');
    expect(typeof index.logScriptOutput).toBe('function');
    expect(typeof index.isSessionPrimary).toBe('function');
    expect(typeof index.getPrimarySessionId).toBe('function');
    expect(typeof index.resetSessionTracking).toBe('function');
    expect(typeof index.addSubagentSession).toBe('function');
  });
});
