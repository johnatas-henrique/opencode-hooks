import { afterEach } from 'vitest';
import {
  cleanupTestDirs,
  cleanupProductionTestFiles,
} from './test/helpers/test-cleanup';

afterEach(async () => {
  await cleanupTestDirs();
  await cleanupProductionTestFiles();
});
