import { sessionHandlers } from './session-handlers';
import { toolHandlers } from './tool-handlers';
import { messageHandlers } from './message-handlers';
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
} from './misc-handlers';
import { toolBeforeHandlers } from './tool-before-handlers';
import { toolAfterHandlers } from './tool-after-handlers';
import type { EventHandler } from '../../types/events';

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
