import {
  handlers,
  buildAllKeysMessage,
  buildAllKeysMessageSimple,
} from '../.opencode/plugins/helpers/default-handlers';
import { normalizeInputForHandler } from '../.opencode/plugins/helpers/events';

const SENSITIVE_PATTERNS: [RegExp, string][] = [
  [/(api[_-]?key)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(token)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(secret)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(password)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(gh[pousr]_[a-zA-Z0-9]{36,})/gi, '$1'],
];

const maskSensitive = (str: string): string => {
  let result = str;
  for (const [pattern, group] of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, `${group}: [REDACTED]`);
  }
  return result;
};

console.log('=== SMOKE TEST ===\n');

// Teste 1: maskSensitive com mascaramento
console.log('1. MASCARAMENTO DE VALORES SENSÍVEIS');
const sensitive =
  'api_key: "sk-1234567890abcdef", token: "ghp_abcdefghij1234567890", password: "secret123"';
console.log(`   Input: ${sensitive}`);
console.log(`   Output: ${maskSensitive(sensitive)}`);
console.log('');

// Teste 2: normalizeInputForHandler para tools
console.log('2. TOOL EVENTS (normalizeInputForHandler)');
const toolInput = { sessionID: 's1', tool: 'bash', args: { command: 'ls' } };
const normalizedTool = normalizeInputForHandler(
  'tool.execute.after',
  toolInput
);
console.log('   Input:', JSON.stringify(toolInput));
console.log('   Normalized:', JSON.stringify(normalizedTool));
console.log('');

// Teste 3: normalizeInputForHandler para sessions
console.log('3. SESSION EVENTS');
const sessionInput = { sessionID: 's1', info: { id: 'test', title: 'Test' } };
const normalizedSession = normalizeInputForHandler(
  'session.created',
  sessionInput
);
console.log('   Input:', JSON.stringify(sessionInput));
console.log('   Normalized:', JSON.stringify(normalizedSession));
console.log('');

// Teste 4: buildAllKeysMessage para tools
console.log('4. BUILD MESSAGE (TOOL)');
const toolEvent = {
  input: { sessionID: 's1', tool: 'bash', args: { command: 'npm run build' } },
  output: { result: 'Build succeeded' },
};
const toolMsg = buildAllKeysMessage(toolEvent);
console.log(toolMsg);
console.log('');

// Teste 5: buildAllKeysMessageSimple para sessions
console.log('5. BUILD MESSAGE (SESSION)');
const sessionEvent = {
  properties: { info: { id: 'test', title: 'My Session' }, sessionID: 's1' },
};
const sessionMsg = buildAllKeysMessageSimple(sessionEvent);
console.log(sessionMsg);
console.log('');

// Teste 6: buildAllKeysMessage para shell.env
console.log('6. BUILD MESSAGE (SHELL.ENV)');
const shellEvent = {
  properties: { cwd: '/home/user', sessionID: 's1' },
  output: { env: { PATH: '/usr/bin', HOME: '/home/user' } },
};
const shellMsg = buildAllKeysMessage(shellEvent);
console.log(shellMsg);
console.log('');

// Teste 7: Handler para tool específico
console.log('7. HANDLER ESPECÍFICO (tool.execute.before.bash)');
const bashHandler = handlers['tool.execute.before.bash'];
const bashInput = {
  sessionID: 's1',
  tool: 'bash',
  args: { command: 'ls -la' },
};
const bashNormalized = normalizeInputForHandler(
  'tool.execute.before.bash',
  bashInput
);
console.log('   Normalized:', JSON.stringify(bashNormalized));
const bashMsg = bashHandler.buildMessage(bashNormalized);
console.log(bashMsg);
console.log('');

// Teste 8: Unknown event handler
console.log('8. UNKNOWN EVENT HANDLER');
const unknownHandler = handlers['unknown.event'];
const unknownEvent = { properties: { customField: 'value', another: 123 } };
const unknownMsg = unknownHandler.buildMessage(unknownEvent);
console.log(unknownMsg);
console.log('');

// Teste 9: Session unknown handler
console.log('9. SESSION UNKNOWN HANDLER');
const sessionUnknownHandler = handlers['session.unknown'];
const sessionUnknownEvent = {
  properties: { sessionID: 's1', someField: 'test' },
};
const sessionUnknownMsg =
  sessionUnknownHandler.buildMessage(sessionUnknownEvent);
console.log(sessionUnknownMsg);
console.log('');

console.log('=== FIM DO SMOKE TEST ===');
