import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/lib/server/utils/security/**/*.test.ts'],
    environment: 'node'
  }
})