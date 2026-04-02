import { readFile } from "fs/promises";
import { join } from "path";
import { saveToFile } from "./save-to-file";

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastConfig {
  title?: string;
  message?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface EventHandlerConfig {
  enabled?: boolean;
  toast?: boolean | ToastConfig;
  script?: string | boolean;
  saveToFile?: boolean;
  appendToSession?: boolean;
  customHandler?: string;
}

export interface EventsConfig {
  version: string;
  description: string;
  enabled: boolean;
  toast: boolean;
  script: boolean;
  saveToFile: boolean;
  appendToSession: boolean;
  events: Record<string, EventHandlerConfig | boolean>;
  handlers?: Record<string, string>;
}

const DEFAULT_CONFIG: EventsConfig = {
  version: "1.0.0",
  description: "Default event toggle configuration",
  enabled: true,
  toast: true,
  script: true,
  saveToFile: true,
  appendToSession: true,
  events: {},
};

let cachedConfig: EventsConfig | null = null;

export async function loadEventsConfig(): Promise<EventsConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const configPath = join(__dirname, "events-config.json");
    const content = await readFile(configPath, "utf-8").catch((err) => {
      saveToFile({ content: `[${new Date().toISOString()}] - Error reading config file at ${configPath}: ${err.message}\n` });
      throw err;
    });
    const parsed = JSON.parse(content) as Partial<EventsConfig>;
    cachedConfig = {
      ...DEFAULT_CONFIG,
      ...parsed,
      events: {
        ...DEFAULT_CONFIG.events,
        ...parsed.events,
      },
    };
    return cachedConfig;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await saveToFile({
      content: `[${new Date().toISOString()}] - Failed to load config, using defaults: ${errorMessage}\n`,
    });
    return DEFAULT_CONFIG;
  }
}

export function getEventConfig(eventType: string): EventHandlerConfig {
  const config = cachedConfig || DEFAULT_CONFIG;
  
  const eventConfig = config.events[eventType];
  if (eventConfig !== undefined) {
    if (typeof eventConfig === "boolean") {
      return { enabled: eventConfig };
    }
    return {
      enabled: eventConfig.enabled ?? config.enabled,
      toast: eventConfig.toast ?? config.toast,
      script: eventConfig.script ?? config.script,
      saveToFile: eventConfig.saveToFile ?? config.saveToFile,
      appendToSession: eventConfig.appendToSession ?? config.appendToSession,
      customHandler: eventConfig.customHandler,
    };
  }
  
  return {
    enabled: config.enabled,
    toast: config.toast,
    script: config.script,
    saveToFile: config.saveToFile,
    appendToSession: config.appendToSession,
  };
}

export function isEventEnabled(eventType: string): boolean {
  const config = getEventConfig(eventType);
  return config.enabled !== false;
}

export function resetConfigCache(): void {
cachedConfig = null;
}
