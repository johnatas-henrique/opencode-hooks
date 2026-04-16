const originalModule = jest.requireActual(
  '../../.opencode/plugins/features/persistence/save-to-file'
);

jest.spyOn(originalModule, 'saveToFile').mockResolvedValue(undefined);

module.exports = {
  ...originalModule,
  saveToFile: jest.fn().mockResolvedValue(undefined),
};
