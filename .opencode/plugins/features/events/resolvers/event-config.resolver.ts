import type {
  EventHandler,
  ConfigResolverContext,
  EventConfigResolver,
} from '../../../types/events';
import type {
  ResolvedEventConfig,
  EventConfig,
  EventOverride,
} from '../../../types/config';
import {
  resolveScripts,
  resolveToastOverride,
  getBooleanField,
} from '../resolution';
import { TOAST_DURATION, DISABLED_CONFIG } from '../../../core/constants';
import { normalizeInputForHandler } from './normalize-input';
import { buildToastMessage } from './build-message';
import { getEventRecorder } from '../../audit/plugin-integration';

function isEventOverride(cfg: EventConfig): cfg is EventOverride {
  return typeof cfg === 'object' && cfg !== null;
}

export class EventConfigResolverImpl implements EventConfigResolver {
  constructor(private context: ConfigResolverContext) {}

  private getHandler(eventType: string): EventHandler | undefined {
    return this.context.handlers[eventType];
  }

  private getDefaultScript(eventType: string): string {
    return `${eventType.replace(/\./g, '-')}.sh`;
  }

  private tryBuildMessage(
    handler: EventHandler,
    eventType: string,
    input: Record<string, unknown>,
    output?: Record<string, unknown>,
    allowedFields?: string[]
  ): string {
    try {
      const normalized = normalizeInputForHandler(eventType, input, output);
      return handler.buildMessage(normalized, allowedFields);
    } catch {
      return '';
    }
  }

  private isEventDisabled(eventCfg: EventConfig): boolean {
    if (eventCfg === false) return true;
    if (isEventOverride(eventCfg)) {
      return eventCfg.enabled === false;
    }
    return false;
  }

  private getAllowedFields(
    handler?: EventHandler,
    userConfig?: EventOverride
  ): string[] | undefined {
    if (userConfig?.allowedFields !== undefined) {
      return userConfig.allowedFields;
    }
    return handler?.allowedFields;
  }

  resolve(
    eventType: string,
    input?: Record<string, unknown>,
    output?: Record<string, unknown>
  ): ResolvedEventConfig {
    const handler = this.getHandler(eventType);
    const userEventConfig = this.context.getEventConfig(eventType);
    const defaultCfg = this.context.default;

    if (!this.context.enabled) {
      return DISABLED_CONFIG;
    }

    if (userEventConfig === undefined) {
      const hasHandler = !!handler;
      if (!hasHandler) {
        const eventRecorder = getEventRecorder();
        const logData = {
          timestamp: new Date().toISOString(),
          type: 'UNKNOWN_EVENT_IN_RESOLVE',
          data: eventType,
          context: 'resolver',
        };
        if (eventRecorder) {
          eventRecorder.logEvent('unknown', { input: logData }).catch(() => {});
        }
      }
      const allowedFields = handler?.allowedFields;
      return {
        enabled: true,
        debug: getBooleanField(true, defaultCfg, 'debug', false),
        toast: getBooleanField(true, defaultCfg, 'toast', false),
        toastTitle: handler?.title ?? '',
        runScripts: getBooleanField(true, defaultCfg, 'runScripts', false),
        toastMessage: handler
          ? this.tryBuildMessage(
              handler,
              eventType,
              input ?? {},
              output,
              allowedFields
            )
          : '',
        toastVariant: handler?.variant ?? 'info',
        toastDuration: handler?.duration ?? TOAST_DURATION.TWO_SECONDS,
        scripts: [],
        logToAudit: true,
        appendToSession: getBooleanField(
          true,
          defaultCfg,
          'appendToSession',
          false
        ),
        runOnlyOnce: false,
        scriptToasts: this.context.scriptToasts,
        allowedFields,
      };
    }

    if (this.isEventDisabled(userEventConfig)) {
      return DISABLED_CONFIG;
    }

    const userOverride = isEventOverride(userEventConfig)
      ? userEventConfig
      : undefined;
    const { scripts } = resolveScripts(
      userEventConfig,
      handler?.defaultScript ?? this.getDefaultScript(eventType),
      []
    );
    const toastCfg = resolveToastOverride(userEventConfig);
    const allowedFields = this.getAllowedFields(handler, userOverride);

    return {
      enabled: true,
      debug: getBooleanField(userEventConfig, defaultCfg, 'debug', false),
      toast: getBooleanField(userEventConfig, defaultCfg, 'toast', false),
      toastTitle: toastCfg?.title ?? handler?.title ?? '',
      runScripts: getBooleanField(
        userEventConfig,
        defaultCfg,
        'runScripts',
        false
      ),
      toastMessage: buildToastMessage(
        toastCfg,
        handler
          ? this.tryBuildMessage(
              handler,
              eventType,
              input ?? {},
              output,
              allowedFields
            )
          : '',
        input ?? {},
        output
      ),
      toastVariant: toastCfg?.variant ?? handler?.variant ?? 'info',
      toastDuration:
        toastCfg?.duration ?? handler?.duration ?? TOAST_DURATION.TWO_SECONDS,
      scripts,
      logToAudit: userOverride?.logToAudit ?? defaultCfg.logToAudit ?? true,
      appendToSession: getBooleanField(
        userEventConfig,
        defaultCfg,
        'appendToSession',
        false
      ),
      runOnlyOnce: getBooleanField(
        userEventConfig,
        defaultCfg,
        'runOnlyOnce',
        false
      ),
      scriptToasts: this.context.scriptToasts,
      allowedFields,
    };
  }
}
