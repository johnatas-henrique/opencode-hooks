const originalModule = vi.importActual(
  '../../.opencode/plugins/features/persistence/save-to-file'
);

vi.spyOn(originalModule, 'saveToFile').mockResolvedValue(undefined);

module.exports = {
  ...originalModule,
  saveToFile: vi.fn().mockResolvedValue(undefined),
};
