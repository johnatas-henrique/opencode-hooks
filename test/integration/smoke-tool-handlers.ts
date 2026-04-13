#!/usr/bin/env node

/**
 * Smoke test for tool-specific handlers.
 * This script verifies that tool handlers are properly registered and resolved.
 * Run: npm run smoke:test:tools
 */

import { resolveToolConfig } from '../../.opencode/plugins/helpers/events';

// List of tools to test with their expected titles (from default-handlers.ts)
const testCases = [
  {
    tool: 'read',
    expectedTitle: '====FILE READ====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'write',
    expectedTitle: '====FILE WRITE====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'edit',
    expectedTitle: '====FILE EDIT====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'bash',
    expectedTitle: '====TERMINAL COMMAND====',
    expectedVariant: 'info',
    expectedDuration: 5000,
  },
  {
    tool: 'task',
    expectedTitle: '====SUBAGENT====',
    expectedVariant: 'success',
    expectedDuration: 10000,
  },
  {
    tool: 'skill',
    expectedTitle: '====SKILL====',
    expectedVariant: 'success',
    expectedDuration: 10000,
  },
  {
    tool: 'chat',
    expectedTitle: '====CHAT====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'glob',
    expectedTitle: '====FILE SEARCH====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'grep',
    expectedTitle: '====TEXT SEARCH====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'list',
    expectedTitle: '====DIRECTORY LIST====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'patch',
    expectedTitle: '====PATCH====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'webfetch',
    expectedTitle: '====WEB FETCH====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'websearch',
    expectedTitle: '====WEB SEARCH====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'codesearch',
    expectedTitle: '====CODE SEARCH====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'todowrite',
    expectedTitle: '====TODO WRITE====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'todoread',
    expectedTitle: '====TODO READ====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'question',
    expectedTitle: '====QUESTION====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'git.commit',
    expectedTitle: '====GIT COMMIT====',
    expectedVariant: 'success',
    expectedDuration: 2000,
  },
  {
    tool: 'git.push',
    expectedTitle: '====GIT PUSH====',
    expectedVariant: 'warning',
    expectedDuration: 2000,
  },
  {
    tool: 'git.pull',
    expectedTitle: '====GIT PULL====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'filesystem_read_file',
    expectedTitle: '====FS READ====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'filesystem_write_file',
    expectedTitle: '====FS WRITE====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'filesystem_list_directory',
    expectedTitle: '====FS LIST====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'filesystem_search_files',
    expectedTitle: '====FS SEARCH====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'filesystem_create_directory',
    expectedTitle: '====FS MKDIR====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'filesystem_move_file',
    expectedTitle: '====FS MOVE====',
    expectedVariant: 'warning',
    expectedDuration: 2000,
  },
  {
    tool: 'filesystem_get_file_info',
    expectedTitle: '====FS STAT====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
  {
    tool: 'gh_grep_searchGitHub',
    expectedTitle: '====GH SEARCH====',
    expectedVariant: 'info',
    expectedDuration: 2000,
  },
];

// Test fallback to event handler
const fallbackCase = {
  tool: 'nonexistent-tool',
  expectedTitle: '====TOOL EXECUTE AFTER====',
  expectedVariant: 'info',
  expectedDuration: 5000,
};

let passed = 0;
let failed = 0;

console.log('🧪 Tool Handlers Smoke Test\n');
console.log('='.repeat(60));

// Test all tools
for (const {
  tool,
  expectedTitle,
  expectedVariant,
  expectedDuration,
} of testCases) {
  try {
    const config = resolveToolConfig('tool.execute.after', tool);

    if (config.toastTitle !== expectedTitle) {
      throw new Error(
        `Title mismatch: expected "${expectedTitle}", got "${config.toastTitle}"`
      );
    }
    if (config.toastVariant !== expectedVariant) {
      throw new Error(
        `Variant mismatch: expected "${expectedVariant}", got "${config.toastVariant}"`
      );
    }
    if (config.toastDuration !== expectedDuration) {
      throw new Error(
        `Duration mismatch: expected ${expectedDuration}, got ${config.toastDuration}`
      );
    }

    console.log(`✅ ${tool.padEnd(30)} → ${expectedTitle}`);
    passed++;
  } catch (err) {
    console.error(`❌ ${tool.padEnd(30)} → ${err.message}`);
    failed++;
  }
}

// Test fallback
try {
  const config = resolveToolConfig('tool.execute.after', fallbackCase.tool);

  if (config.toastTitle !== fallbackCase.expectedTitle) {
    throw new Error(
      `Fallback title: expected "${fallbackCase.expectedTitle}", got "${config.toastTitle}"`
    );
  }
  if (config.toastVariant !== fallbackCase.expectedVariant) {
    throw new Error(
      `Fallback variant: expected "${fallbackCase.expectedVariant}", got "${config.toastVariant}"`
    );
  }
  if (config.toastDuration !== fallbackCase.expectedDuration) {
    throw new Error(
      `Fallback duration: expected ${fallbackCase.expectedDuration}, got ${config.toastDuration}`
    );
  }

  console.log(
    `✅ ${fallbackCase.tool.padEnd(30)} → ${fallbackCase.expectedTitle} (fallback)`
  );
  passed++;
} catch (err) {
  console.error(`❌ ${fallbackCase.tool.padEnd(30)} → ${err.message}`);
  failed++;
}

console.log('='.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n✨ All tool handlers working correctly!\n');
  process.exit(0);
}
