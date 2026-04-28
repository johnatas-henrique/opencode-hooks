import { DEFAULTS } from '../../core/constants';
import { buildKeysMessageSimple } from '../message-formatter/build-keys-message';
import type { EventHandler } from '../../types/events';
import type { HandlerConfig } from '../../types/messages';

const createHandler = (config: HandlerConfig): EventHandler => ({
  title: config.title,
  variant: config.variant,
  duration: config.duration,
  defaultScript: config.defaultScript,
  buildMessage: config.buildMessage,
  allowedFields: config.allowedFields,
  defaultTemplate: config.defaultTemplate,
});

export const chatHandlers: Record<string, EventHandler> = {
  'chat.headers': createHandler({
    title: '====CHAT HEADERS====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'chat-headers.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'chat.message': createHandler({
    title: '====CHAT MESSAGE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'chat-message.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'chat.params': createHandler({
    title: '====CHAT PARAMS====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'chat-params.sh',
    buildMessage: buildKeysMessageSimple,
  }),
};

export const commandHandlers: Record<string, EventHandler> = {
  'command.execute.before': createHandler({
    title: '====COMMAND EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'command-execute-before.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'command.executed': createHandler({
    title: '====COMMAND EXECUTED====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'command-executed.sh',
    buildMessage: buildKeysMessageSimple,
  }),
};

export const serverHandlers: Record<string, EventHandler> = {
  'server.connected': createHandler({
    title: '====SERVER CONNECTED====',
    variant: 'success',
    duration: DEFAULTS.toast.durations.TEN_SECONDS,
    defaultScript: 'server-connected.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'server.instance.disposed': createHandler({
    title: '====SERVER DISPOSED====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'server-instance-disposed.sh',
    buildMessage: buildKeysMessageSimple,
  }),
};

export const shellHandlers: Record<string, EventHandler> = {
  'shell.env': createHandler({
    title: '====SHELL ENV====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'shell-env.sh',
    buildMessage: buildKeysMessageSimple,
  }),
};

export const todoHandlers: Record<string, EventHandler> = {
  'todo.updated': createHandler({
    title: '====TODO UPDATED====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'todo-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),
};

export const tuiHandlers: Record<string, EventHandler> = {
  'tui.command.execute': createHandler({
    title: '====TUI COMMAND EXECUTE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tui-command-execute.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'tui.prompt.append': createHandler({
    title: '====TUI PROMPT APPEND====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tui-prompt-append.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'tui.toast.show': createHandler({
    title: '====TUI TOAST SHOW====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tui-toast-show.sh',
    buildMessage: buildKeysMessageSimple,
  }),
};

export const lspHandlers: Record<string, EventHandler> = {
  'lsp.client.diagnostics': createHandler({
    title: '====LSP CLIENT DIAGNOSTICS====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'lsp-client-diagnostics.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'lsp.updated': createHandler({
    title: '====LSP UPDATED====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'lsp-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),
};

export const experimentalHandlers: Record<string, EventHandler> = {
  'experimental.chat.messages.transform': createHandler({
    title: '====EXPERIMENTAL CHAT MESSAGES TRANSFORM====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'experimental-chat-messages-transform.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'experimental.chat.system.transform': createHandler({
    title: '====EXPERIMENTAL CHAT SYSTEM TRANSFORM====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'experimental-chat-system-transform.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'experimental.session.compacting': createHandler({
    title: '====EXPERIMENTAL SESSION COMPACTING====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'experimental-session-compacting.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'experimental.text.complete': createHandler({
    title: '====EXPERIMENTAL TEXT COMPLETE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'experimental-text-complete.sh',
    buildMessage: buildKeysMessageSimple,
  }),
};

export const otherHandlers: Record<string, EventHandler> = {
  'tool.definition': createHandler({
    title: '====TOOL DEFINITION====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-definition.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'unknown.event': createHandler({
    title: '====UNKNOWN EVENT====',
    variant: 'warning',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'unknown-event.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'installation.updated': createHandler({
    title: '====INSTALLATION UPDATED====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'installation-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),
};
