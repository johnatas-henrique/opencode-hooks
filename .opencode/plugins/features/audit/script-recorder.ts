import type { AuditConfig, ScriptRecord } from '../../types/audit';

export interface ScriptRecorderDependencies {
  writeLine: (
    fileType: 'scripts',
    data: Record<string, unknown>
  ) => Promise<void>;
}

export interface ScriptInput {
  script: string;
  args?: string[];
  startTime?: number;
}

const TRUNCATION_KB = 10;

export function shouldLogScripts(config: AuditConfig): boolean {
  return config.enabled;
}

export function truncateOutput(
  output: string,
  maxKb: number = TRUNCATION_KB
): string {
  const maxBytes = maxKb * 1024;
  if (output.length <= maxBytes) {
    return output;
  }
  const truncated = output.slice(-maxBytes);
  const newlineIndex = truncated.indexOf('\n');
  if (newlineIndex > 0 && newlineIndex < 100) {
    return truncated.slice(newlineIndex + 1);
  }
  return truncated;
}

export function createScriptRecord(
  input: ScriptInput,
  result: { output: string; error: string | null; exitCode: number },
  shouldLogResult: boolean
): ScriptRecord | null {
  if (!shouldLogResult) {
    return null;
  }

  const duration = input.startTime ? Date.now() - input.startTime : undefined;

  const output = input.script.endsWith('.sh')
    ? truncateOutput(result.output)
    : result.output;

  return {
    ts: new Date().toISOString(),
    script: input.script,
    args: input.args ?? [],
    exit: result.exitCode,
    duration,
    output: output || undefined,
    error: result.error || undefined,
  };
}

export function createScriptRecorder(
  config: AuditConfig,
  deps: ScriptRecorderDependencies
) {
  const canLog = shouldLogScripts(config);

  async function logScript(
    input: ScriptInput,
    result: { output: string; error: string | null; exitCode: number }
  ): Promise<void> {
    const record = createScriptRecord(input, result, canLog);
    if (record !== null) {
      await deps.writeLine('scripts', record);
    }
  }

  return { logScript };
}
