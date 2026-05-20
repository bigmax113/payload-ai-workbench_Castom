import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('redirects homepage to the admin surface', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveURL(/\/admin/)
  })
})
