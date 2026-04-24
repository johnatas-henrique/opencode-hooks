import type {
  AuditConfig,
  ScriptRecord,
  ScriptRecorderDependencies,
  ScriptInput,
} from '../../types/audit';

export function shouldLogScripts(config: AuditConfig): boolean {
  return config.enabled;
}

export function truncateOutput(output: string, maxKb: number): string {
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
  shouldLogResult: boolean,
  logTruncationKB: number
): ScriptRecord | null {
  if (!shouldLogResult) {
    return null;
  }

  const duration = input.startTime ? Date.now() - input.startTime : undefined;

  const output = input.script.endsWith('.sh')
    ? truncateOutput(result.output, logTruncationKB)
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
  const logTruncationKB = config.logTruncationKB;

  async function logScript(
    input: ScriptInput,
    result: { output: string; error: string | null; exitCode: number }
  ): Promise<void> {
    const record = createScriptRecord(input, result, canLog, logTruncationKB);
    if (record !== null) {
      await deps.writeLine('scripts', record);
    }
  }

  return { logScript };
}
