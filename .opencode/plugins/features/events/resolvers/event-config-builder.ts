import type {
  EventHandler,
  ConfigResolverContext,
} from '../../../types/events';
import type {
  ResolvedEventConfig,
  EventConfig,
  EventOverride,
} from '../../../types/config';
import { DEFAULTS } from '../../../core/constants';
import { resolveScripts } from '../resolution/scripts';
import { resolveToastOverride } from '../resolution/toast';
import { getBooleanField } from '../resolution/boolean-field';
import { normalizeInputForHandler } from './normalize-input';
import { buildToastMessage } from './build-message';
import { getEventRecorder } from '../../audit/plugin-integration';

export class ConfigBuilder {
  private handler?: EventHandler;
  private userEventConfig?: EventConfig;
  private isOverride = false;

  constructor(
    private context: ConfigResolverContext,
    private eventType: string,
    private input?: Record<string, unknown>,
    private output?: Record<string, unknown>
  ) {}

  resolve(): ResolvedEventConfig {
    if (!this.context.enabled) {
      return DEFAULTS.config.disabled;
    }

    this.handler = this.context.handlers[this.eventType];
    this.userEventConfig = this.context.getEventConfig(this.eventType);
    const defaultCfg = this.context.default;

    if (this.userEventConfig === undefined) {
      return this.buildDefault(defaultCfg);
    }

    if (this.isEventDisabled()) {
      return DEFAULTS.config.disabled;
    }

    return this.buildMerged(defaultCfg);
  }

  private buildDefault(defaultCfg: EventOverride): ResolvedEventConfig {
    const hasHandler = !!this.handler;
    if (!hasHandler) {
      const eventRecorder = getEventRecorder();
      if (eventRecorder) {
        eventRecorder
          .logEvent('UNKNOWN_EVENT_IN_RESOLVE', {
            context: 'builder',
            input: { eventType: this.eventType },
          })
          .catch(() => {});
      }
    }

    const allowedFields = this.handler?.allowedFields;
    return {
      enabled: true,
      debug: getBooleanField(true, defaultCfg, 'debug', false),
      toast: getBooleanField(true, defaultCfg, 'toast', false),
      toastTitle: this.handler?.title ?? '',
      runScripts: getBooleanField(true, defaultCfg, 'runScripts', false),
      toastMessage: this.handler ? this.tryBuildMessage(allowedFields) : '',
      toastVariant: this.handler?.variant ?? 'info',
      toastDuration:
        this.handler?.duration ?? DEFAULTS.toast.durations.TWO_SECONDS,
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
      block: [],
    };
  }

  private buildMerged(defaultCfg: EventOverride): ResolvedEventConfig {
    const userOverride = this.isOverride
      ? (this.userEventConfig as EventOverride)
      : undefined;

    const { scripts } = resolveScripts(
      this.userEventConfig!,
      this.handler?.defaultScript ?? this.getDefaultScript(),
      []
    );
    const toastCfg = resolveToastOverride(this.userEventConfig!);
    const allowedFields = this.getAllowedFields(userOverride);

    return {
      enabled: true,
      debug: getBooleanField(this.userEventConfig!, defaultCfg, 'debug', false),
      toast: getBooleanField(this.userEventConfig!, defaultCfg, 'toast', false),
      toastTitle: toastCfg?.title ?? this.handler?.title ?? '',
      runScripts: getBooleanField(
        this.userEventConfig!,
        defaultCfg,
        'runScripts',
        false
      ),
      toastMessage: buildToastMessage(
        toastCfg,
        this.handler ? this.tryBuildMessage(allowedFields) : '',
        this.input ?? {},
        this.output
      ),
      toastVariant: toastCfg?.variant ?? this.handler?.variant ?? 'info',
      toastDuration:
        toastCfg?.duration ??
        this.handler?.duration ??
        DEFAULTS.toast.durations.TWO_SECONDS,
      scripts,
      logToAudit: userOverride?.logToAudit ?? defaultCfg.logToAudit ?? true,
      appendToSession: getBooleanField(
        this.userEventConfig!,
        defaultCfg,
        'appendToSession',
        false
      ),
      runOnlyOnce: getBooleanField(
        this.userEventConfig!,
        defaultCfg,
        'runOnlyOnce',
        false
      ),
      scriptToasts: this.context.scriptToasts,
      allowedFields,
      block: [],
    };
  }

  private isEventDisabled(): boolean {
    if (this.userEventConfig === false) return true;
    if (
      typeof this.userEventConfig === 'object' &&
      this.userEventConfig !== null
    ) {
      this.isOverride = true;
      return (this.userEventConfig as EventOverride).enabled === false;
    }
    return false;
  }

  private getAllowedFields(userOverride?: EventOverride): string[] | undefined {
    if (userOverride?.allowedFields !== undefined) {
      return userOverride.allowedFields;
    }
    return this.handler?.allowedFields;
  }

  private getDefaultScript(): string {
    return `${this.eventType.replace(/\./g, '-')}.sh`;
  }

  private tryBuildMessage(allowedFields?: string[]): string {
    try {
      const normalized = normalizeInputForHandler(
        this.eventType,
        this.input ?? {},
        this.output
      );
      return this.handler!.buildMessage(normalized, allowedFields);
    } catch {
      return '';
    }
  }
}
