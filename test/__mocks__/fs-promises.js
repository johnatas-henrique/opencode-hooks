module.exports = {
  readFile: jest.fn().mockResolvedValue(''),
  appendFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
};
