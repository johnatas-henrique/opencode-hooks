const handlers = {
  'session.created': {
    title: '====SESSION CREATED====',
    variant: 'success',
    duration: 2000,
    defaultScript: 'session-created.sh',
    buildMessage: () => 'Session created',
  },
  'session.error': {
    title: '====SESSION ERROR====',
    variant: 'error',
    duration: 30000,
    defaultScript: 'session-error.sh',
    buildMessage: () => 'Session error',
  },
  'server.instance.disposed': {
    title: '',
    variant: 'info',
    duration: 0,
    defaultScript: 'session-stop.sh',
    buildMessage: () => 'Server disposed',
  },
  'tool.execute.after': {
    title: '====TOOL AFTER====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tool-execute-after.sh',
    buildMessage: () => 'Tool executed',
  },
  'tool.execute.before': {
    title: '====TOOL BEFORE====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tool-execute-before.sh',
    buildMessage: () => 'Tool before',
  },
  'tool.execute.before.bash': {
    title: '====BASH BEFORE====',
    variant: 'warning',
    duration: 3000,
    defaultScript: 'tool-execute-before-bash.sh',
    buildMessage: () => 'Bash before',
  },
  'session.compacted': {
    title: '====SESSION COMPACTED====',
    variant: 'info',
    duration: 5000,
    defaultScript: 'session-compacted.sh',
    buildMessage: () => 'Session compacted',
  },
  'session.idle': {
    title: '====SESSION IDLE====',
    variant: 'info',
    duration: 5000,
    defaultScript: 'session-idle.sh',
    buildMessage: () => 'Session idle',
  },
  'session.deleted': {
    title: '====SESSION DELETED====',
    variant: 'error',
    duration: 5000,
    defaultScript: 'session-deleted.sh',
    buildMessage: () => 'Session deleted',
  },
  'session.updated': {
    title: '====SESSION UPDATED====',
    variant: 'info',
    duration: 5000,
    defaultScript: 'session-updated.sh',
    buildMessage: () => 'Session updated',
  },
  'session.status': {
    title: '====SESSION STATUS====',
    variant: 'info',
    duration: 5000,
    defaultScript: 'session-status.sh',
    buildMessage: () => 'Session status',
  },
  'message.part.removed': {
    title: '====MESSAGE PART REMOVED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'message-part-removed.sh',
    buildMessage: () => 'Message part removed',
  },
  'message.part.updated': {
    title: '====MESSAGE PART UPDATED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'message-part-updated.sh',
    buildMessage: () => 'Message part updated',
  },
  'message.part.delta': {
    title: '====MESSAGE PART DELTA====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'message-part-delta.sh',
    buildMessage: () => 'Message part delta',
  },
  'message.removed': {
    title: '====MESSAGE REMOVED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'message-removed.sh',
    buildMessage: () => 'Message removed',
  },
  'message.updated': {
    title: '====MESSAGE UPDATED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'message-updated.sh',
    buildMessage: () => 'Message updated',
  },
  'file.edited': {
    title: '====FILE EDITED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'file-edited.sh',
    buildMessage: () => 'File edited',
  },
  'file.watcher.updated': {
    title: '====FILE WATCHER UPDATED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'file-watcher-updated.sh',
    buildMessage: () => 'File watcher updated',
  },
  'shell.env': {
    title: '====SHELL ENV====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'shell-env.sh',
    buildMessage: () => 'Shell env',
  },
  'permission.asked': {
    title: '====PERMISSION ASKED====',
    variant: 'warning',
    duration: 5000,
    defaultScript: 'permission-asked.sh',
    buildMessage: () => 'Permission asked',
  },
  'permission.replied': {
    title: '====PERMISSION REPLIED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'permission-replied.sh',
    buildMessage: () => 'Permission replied',
  },
  'unknown.event': {
    title: '====UNKNOWN====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'unknown.sh',
    buildMessage: () => 'Unknown',
  },
};

export const resolveEventConfig = (eventType: string) => ({
  enabled: true,
  toast: true,
  toastTitle: handlers[eventType]?.title ?? '',
  toastMessage: '',
  toastVariant: (handlers[eventType]?.variant ?? 'info') as
    | 'info'
    | 'success'
    | 'warning'
    | 'error',
  toastDuration: handlers[eventType]?.duration ?? 2000,
  scripts: handlers[eventType]?.defaultScript
    ? [handlers[eventType].defaultScript]
    : [],
  runScripts: false,
  saveToFile: false,
  appendToSession: false,
  runOnlyOnce: false,
  debug: false,
  scriptToasts: {
    showOutput: true,
    showError: true,
    outputVariant: 'info' as const,
    errorVariant: 'error' as const,
    outputDuration: 5000,
    errorDuration: 15000,
    outputTitle: 'Script Output',
    errorTitle: 'Script Error',
  },
});

export const resolveToolConfig = (
  eventType: string,
  toolName: string,
  _input?: Record<string, unknown>,
  _output?: Record<string, unknown>
) => {
  const toolHandlerKey = `${eventType}.${toolName}`;
  const handler = handlers[toolHandlerKey] ?? handlers[eventType];
  return {
    enabled: true,
    toast: true,
    toastTitle: handler?.title ?? '',
    toastMessage: '',
    toastVariant: (handler?.variant ?? 'info') as
      | 'info'
      | 'success'
      | 'warning'
      | 'error',
    toastDuration: handler?.duration ?? 2000,
    scripts: handler?.defaultScript ? [handler.defaultScript] : [],
    runScripts: false,
    saveToFile: false,
    appendToSession: false,
    runOnlyOnce: false,
    debug: false,
    scriptToasts: {
      showOutput: true,
      showError: true,
      outputVariant: 'info' as const,
      errorVariant: 'error' as const,
      outputDuration: 5000,
      errorDuration: 15000,
      outputTitle: 'Script Output',
      errorTitle: 'Script Error',
    },
  };
};

export const normalizeInputForHandler = (
  eventType: string,
  _input: Record<string, unknown>,
  _output?: Record<string, unknown>
) => {
  if (eventType.startsWith('tool.execute.')) {
    return { input, output };
  }
  if (input.properties && typeof input.properties === 'object') {
    return { properties: input.properties, output };
  }
  return { properties: input, output };
};

export const getHandler = (eventType: string) => handlers[eventType];
