import { formatValue } from './format-value';
import { getValueByPath } from './get-value-by-path';
import { formatTime } from './format-time';

interface BuildKeysEvent {
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  properties?: Record<string, unknown>;
}

export function buildKeysMessage(
  event: BuildKeysEvent,
  allowedFields?: string[]
): string {
  const lines: string[] = [];

  const addLine = (key: string, value: unknown): void => {
    lines.push(`${key}: ${formatValue(value)}`);
  };

  if (!allowedFields || allowedFields.length === 0) {
    if (event.input) {
      const input = event.input;
      for (const [key, value] of Object.entries(input)) {
        if (key === 'args') {
          const args = value as Record<string, unknown>;
          for (const [argKey, argValue] of Object.entries(args ?? {})) {
            addLine(`input.args.${argKey}`, argValue);
          }
        } else {
          addLine(`input.${key}`, value);
        }
      }
    }

    if (event.output) {
      const output = event.output;
      for (const [key, value] of Object.entries(output)) {
        addLine(`output.${key}`, value);
      }
    }
  } else {
    for (const field of allowedFields) {
      let value: unknown;

      if (field.startsWith('input.')) {
        value = getValueByPath(event.input, field.substring(6));
      } else if (field.startsWith('output.')) {
        value = getValueByPath(event.output, field.substring(7));
      } else if (field.startsWith('properties.')) {
        value = getValueByPath(event.properties, field.substring(11));
      } else {
        value =
          getValueByPath(event.input, field) ??
          getValueByPath(event.output, field) ??
          getValueByPath(event.properties, field);
      }

      if (value !== undefined) {
        addLine(field, value);
      }
    }
  }

  if (!lines.length && event.properties) {
    const props = event.properties;
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'object' && value !== null) {
        addLine(key, JSON.stringify(value));
      } else {
        addLine(key, value);
      }
    }
  }

  lines.push(`Time: ${formatTime()}`);
  return lines.join('\n');
}

export function buildKeysMessageSimple(
  event: BuildKeysEvent,
  allowedFields?: string[]
): string {
  const lines: string[] = [];

  const flatten = (obj: Record<string, unknown>, prefix = ''): void => {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        flatten(value as Record<string, unknown>, fullKey);
      } else {
        lines.push(`${fullKey}: ${formatValue(value)}`);
      }
    }
  };

  if (!allowedFields || allowedFields.length === 0) {
    if (event.properties) {
      flatten(event.properties);
    }
  } else {
    for (const field of allowedFields) {
      const value = getValueByPath(event.properties, field);
      if (value !== undefined) {
        lines.push(`${field}: ${formatValue(value)}`);
      }
    }
  }

  lines.push(`Time: ${formatTime()}`);
  return lines.join('\n');
}
