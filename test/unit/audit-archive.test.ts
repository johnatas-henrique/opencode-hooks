import { archiveLogFiles } from '../../.opencode/plugins/features/audit/audit-logger';

describe('archiveLogFiles', () => {
  const mockMkdir = vi.fn().mockResolvedValue(undefined);
  const mockStat = vi.fn().mockRejectedValue(new Error('File not found'));
  const mockRename = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create archive directory', async () => {
    await archiveLogFiles(
      '/base',
      '/archive',
      {
        events: 'events.jsonl',
        scripts: 'scripts.jsonl',
        errors: 'errors.jsonl',
      },
      {
        mkdir: mockMkdir,
        stat: mockStat,
        rename: mockRename,
      }
    );

    expect(mockMkdir).toHaveBeenCalledWith('/archive', { recursive: true });
  });

  it('should skip files that do not exist', async () => {
    await archiveLogFiles(
      '/base',
      '/archive',
      {
        events: 'events.jsonl',
        scripts: 'scripts.jsonl',
        errors: 'errors.jsonl',
      },
      {
        mkdir: mockMkdir,
        stat: mockStat,
        rename: mockRename,
      }
    );

    expect(mockRename).not.toHaveBeenCalled();
  });

  it('should rename existing files to archive', async () => {
    mockStat.mockResolvedValueOnce({ size: 100 });
    mockStat.mockRejectedValue(new Error('File not found'));

    await archiveLogFiles(
      '/base',
      '/archive',
      {
        events: 'events.jsonl',
        scripts: 'scripts.jsonl',
        errors: 'errors.jsonl',
      },
      {
        mkdir: mockMkdir,
        stat: mockStat,
        rename: mockRename,
      }
    );

    expect(mockRename).toHaveBeenCalledTimes(1);
    expect(mockRename).toHaveBeenCalledWith(
      '/base/events.jsonl',
      expect.stringMatching(/events-.*\.jsonl$/)
    );
  });
});
