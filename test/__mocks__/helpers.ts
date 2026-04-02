import { jest } from "@jest/globals";

export const logParser = (eventType: string): string => {
  return eventType;
};

export const runScript = jest.fn(async () => {
  return "Script executed";
});

export const saveToFile = jest.fn(async () => {
  return;
});

jest.unmock("./helpers/log-parser");
jest.unmock("./helpers/run-script");
jest.unmock("./helpers/save-to-file");
