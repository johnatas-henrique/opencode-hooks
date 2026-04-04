const customReleaseNotes = require('./custom-release-notes');

module.exports = {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'merge', release: false },
          { type: 'chore', release: false },
          { type: 'docs', release: false },
          { type: 'test', release: false },
        ],
      },
    ],
    customReleaseNotes,
    '@semantic-release/github',
  ],
};
