function generateReleaseNotes(pluginConfig, context) {
  const { commits, previousTag, currentTag, commitsByType, nextRelease } =
    context;

  let owner = context.owner;
  let repo = context.repo;

  if (!owner || !repo) {
    const gitUrl =
      context.repositoryUrl || context.commits?.[0]?.repository_url;
    if (gitUrl && gitUrl.includes('github.com')) {
      const match = gitUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
      if (match) {
        owner = match[1];
        repo = match[2];
      }
    }
  }

  if (!owner || !repo) {
    owner = 'johnatas-henrique';
    repo = 'opencode-hooks';
  }

  const typeMap = {
    feat: { emoji: '✨', name: 'Features' },
    fix: { emoji: '🐛', name: 'Fixes' },
    docs: { emoji: '📚', name: 'Documentation' },
    chore: { emoji: '♻️', name: 'Internal' },
    test: { emoji: '✅', name: 'Tests' },
    refactor: { emoji: '♻️', name: 'Refactoring' },
    perf: { emoji: '⚡️', name: 'Performance' },
    style: { emoji: '💄', name: 'Styles' },
    build: { emoji: '📦️', name: 'Build' },
    ci: { emoji: '👷', name: 'CI' },
  };

  const sortedTypes = [
    'feat',
    'fix',
    'perf',
    'refactor',
    'docs',
    'test',
    'style',
    'build',
    'ci',
    'chore',
  ];
  const sections = [];

  if (!commitsByType || Object.keys(commitsByType).length === 0) {
    const commitLines = commits
      .map((commit) => {
        const shortHash = commit.hash.substring(0, 7);
        return `- ${commit.subject} (${shortHash})`;
      })
      .join('\n');
    sections.push(`### 📌 Changes\n\n${commitLines}`);
  } else {
    for (const type of sortedTypes) {
      const typeCommits = commitsByType[type] || [];
      if (typeCommits.length === 0) continue;

      const { emoji, name } = typeMap[type] || {
        emoji: '📌',
        name: type.charAt(0).toUpperCase() + type.slice(1),
      };

      const commitLines = typeCommits
        .map((commit) => {
          const shortHash = commit.hash.substring(0, 7);
          return `- ${commit.subject} (${shortHash})`;
        })
        .join('\n');

      sections.push(`### ${emoji} ${name}\n\n${commitLines}`);
    }
  }

  let notes = "## What's Changed\n\n";
  notes += sections.join('\n\n');

  const prevVersion = previousTag ? previousTag.replace(/^v/, '') : 'initial';
  const currVersion = nextRelease.version;
  const changelogUrl = `https://github.com/${owner}/${repo}/compare/v${prevVersion}...v${currVersion}`;

  notes += `\n\n**Full Changelog**: ${changelogUrl}`;

  return notes;
}

module.exports = {
  name: 'custom-release-notes',
  generateNotes: generateReleaseNotes,
};
