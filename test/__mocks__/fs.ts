const originalModule = jest.requireActual(
  '../../.opencode/plugins/helpers/save-to-file'
);

jest.spyOn(originalModule, 'saveToFile').mockResolvedValue(undefined);

module.exports = {
  ...originalModule,
  saveToFile: jest.fn().mockResolvedValue(undefined),
};
