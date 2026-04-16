describe('barrel file (index.ts) - re-exports', () => {
  it('should import and call all re-exported functions', async () => {
    const index = await import('../../.opencode/plugins/index');

    expect(typeof index.saveToFile).toBe('function');
    expect(typeof index.runScript).toBe('function');
    expect(typeof index.runScriptAndHandle).toBe('function');
    expect(typeof index.appendToSession).toBe('function');
    expect(typeof index.handleDebugLog).toBe('function');
    expect(typeof index.initGlobalToastQueue).toBe('function');
    expect(typeof index.useGlobalToastQueue).toBe('function');
    expect(typeof index.handlers).toBe('object');
    expect(typeof index.resolveEventConfig).toBe('function');
    expect(typeof index.resolveToolConfig).toBe('function');
    expect(typeof index.normalizeInputForHandler).toBe('function');
    expect(typeof index.EventType).toBe('object');
    expect(typeof index.showActivePluginsToast).toBe('function');
    expect(typeof index.showStartupToast).toBe('function');
    expect(typeof index.logEventConfig).toBe('function');
    expect(typeof index.logScriptOutput).toBe('function');
    expect(typeof index.addSubagentSession).toBe('function');
  });

  it('should export from events/index', async () => {
    const events =
      await import('../../.opencode/plugins/features/events/index');
    expect(typeof events.normalizeInputForHandler).toBe('function');
    expect(typeof events.createContext).toBe('function');
    expect(typeof events.createFactory).toBe('function');
    expect(typeof events.createEventResolver).toBe('function');
    expect(typeof events.createToolResolver).toBe('function');
    expect(typeof events.EventConfigResolverImpl).toBe('function');
    expect(typeof events.ToolConfigResolverImpl).toBe('function');
    expect(typeof events.resolveScripts).toBe('function');
    expect(typeof events.resolveToastOverride).toBe('function');
    expect(typeof events.resolveToastEnabled).toBe('function');
    expect(typeof events.resolveDefaultToast).toBe('function');
    expect(typeof events.getBooleanField).toBe('function');
    expect(typeof events.resolveSaveToFile).toBe('function');
  });

  it('should export from events/resolution/index', async () => {
    const resolution =
      await import('../../.opencode/plugins/features/events/resolution/index');
    expect(typeof resolution.getBooleanField).toBe('function');
    expect(typeof resolution.resolveSaveToFile).toBe('function');
    expect(typeof resolution.resolveScripts).toBe('function');
    expect(typeof resolution.resolveToastOverride).toBe('function');
  });

  it('should export from events/resolvers/index', async () => {
    const resolvers =
      await import('../../.opencode/plugins/features/events/resolvers/index');
    expect(typeof resolvers.EventConfigResolverImpl).toBe('function');
    expect(typeof resolvers.ToolConfigResolverImpl).toBe('function');
  });

  it('should export from message-formatter/index', async () => {
    const formatter =
      await import('../../.opencode/plugins/features/message-formatter/index');
    expect(typeof formatter.maskSensitive).toBe('function');
    expect(typeof formatter.truncate).toBe('function');
    expect(typeof formatter.formatValue).toBe('function');
    expect(typeof formatter.formatTime).toBe('function');
    expect(typeof formatter.getValueByPath).toBe('function');
    expect(typeof formatter.buildKeysMessage).toBe('function');
    expect(typeof formatter.buildKeysMessageSimple).toBe('function');
  });

  it('should export from block-system/index', async () => {
    const blockSystem =
      await import('../../.opencode/plugins/features/block-system/index');
    expect(typeof blockSystem.executeBlocking).toBe('function');
    expect(typeof blockSystem.createBlockSystem).toBe('function');
  });

  it('should export from scripts/index', async () => {
    const scripts =
      await import('../../.opencode/plugins/features/scripts/index');
    expect(typeof scripts.runScript).toBe('function');
    expect(typeof scripts.runScriptAndHandle).toBe('function');
  });

  it('should export from messages/index', async () => {
    const messages =
      await import('../../.opencode/plugins/features/messages/index');
    expect(typeof messages.appendToSession).toBe('function');
    expect(typeof messages.showActivePluginsToast).toBe('function');
    expect(typeof messages.showStartupToast).toBe('function');
  });

  it('should export from config/index', async () => {
    const config = await import('../../.opencode/plugins/config/index');
    expect(typeof config.userConfig).toBe('object');
    expect(typeof config.blockEnvFiles).toBe('function');
    expect(typeof config.blockGitForce).toBe('function');
    expect(typeof config.blockScriptsFailed).toBe('function');
    expect(typeof config.blockByPath).toBe('function');
  });

  it('should export from types/index', async () => {
    const types = await import('../../.opencode/plugins/types/index');
    expect(typeof types.EventType).toBe('object');
  });
});
