const createdFiles: string[] = [];
const createdDirs: string[] = [];

export function trackTestFile(filePath: string): void {
  createdFiles.push(filePath);
}

export function trackTestDir(dirPath: string): void {
  createdDirs.push(dirPath);
}

export async function cleanupTestDirs(): Promise<void> {
  createdFiles.length = 0;
  createdDirs.length = 0;
}

export async function cleanupProductionTestFiles(): Promise<void> {
  // no-op by default
}
