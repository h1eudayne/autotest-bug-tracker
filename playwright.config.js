import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'node web-app/server.js',
      port: 3000,
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev',
      cwd: './web-app/frontend',
      port: 5173,
      reuseExistingServer: true,
    }
  ],
});
