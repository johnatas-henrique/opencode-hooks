import { sessionHandlers } from '.opencode/plugins/features/handlers/session-handlers';
import { toolHandlers } from '.opencode/plugins/features/handlers/tool-handlers';
import { messageHandlers } from '.opencode/plugins/features/handlers/message-handlers';
import {
  chatHandlers,
  commandHandlers,
  serverHandlers,
  shellHandlers,
  todoHandlers,
  tuiHandlers,
  lspHandlers,
  experimentalHandlers,
  otherHandlers,
} from '.opencode/plugins/features/handlers/misc-handlers';
import { toolBeforeHandlers } from '.opencode/plugins/features/handlers/tool-before-handlers';
import { toolAfterHandlers } from '.opencode/plugins/features/handlers/tool-after-handlers';
import type { EventHandler } from '.opencode/plugins/types/events';

export const handlers: Record<string, EventHandler> = {
  ...sessionHandlers,
  ...toolHandlers,
  ...messageHandlers,
  ...chatHandlers,
  ...commandHandlers,
  ...serverHandlers,
  ...shellHandlers,
  ...todoHandlers,
  ...tuiHandlers,
  ...lspHandlers,
  ...experimentalHandlers,
  ...otherHandlers,
  ...toolBeforeHandlers,
  ...toolAfterHandlers,
};
