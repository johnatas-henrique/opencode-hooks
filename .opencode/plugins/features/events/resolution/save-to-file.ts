import type {
  EventConfig,
  EventOverride,
  FileTemplate,
} from '../../../types/config';

export interface ResolvedSaveToFile {
  readonly enabled: boolean;
  readonly template?: string;
  readonly path?: string;
}

export function resolveSaveToFile(
  eventCfg: EventConfig | undefined,
  defaultCfg: EventOverride | undefined
): boolean | FileTemplate {
  const parseFileTemplate = (value: unknown): boolean | FileTemplate => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if ('enabled' in obj) {
        return {
          enabled: true,
          template: obj.template as string | undefined,
          path: obj.path as string | undefined,
        };
      }
      return {
        enabled: true,
        template: obj.template as string | undefined,
        path: obj.path as string | undefined,
      };
    }
    return false;
  };

  if (typeof eventCfg === 'object' && eventCfg !== null) {
    const value = (eventCfg as EventOverride).saveToFile;
    if (value !== undefined) {
      return parseFileTemplate(value);
    }
  }
  if (defaultCfg !== null && defaultCfg !== undefined) {
    const value = defaultCfg.saveToFile;
    if (value !== undefined) {
      return parseFileTemplate(value);
    }
  }
  return false;
}
