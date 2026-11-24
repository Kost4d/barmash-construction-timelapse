import { test, expect } from '@playwright/test';

test('sequence loads, renders and responds to playback, seeking and fullscreen', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.keyframe')).toHaveCount(12);
  const dimensions = await page.locator('#viewer').boundingBox();
  expect(dimensions.width / dimensions.height).toBeCloseTo(16 / 9, 2);
  // A real rendered framebuffer must contain varied opaque pixels.
  const pixels = await page.locator('canvas').evaluate((canvas) => new Promise((resolve) => requestAnimationFrame(() => {
    const gl = canvas.getContext('webgl2');
    const result = new Uint8Array(4);
    gl.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, result);
    resolve([...result]);
  })));
  expect(pixels[3]).toBe(255);
  await page.locator('#play').click();
  await expect.poll(async () => Number(await page.locator('#timeline').inputValue())).toBeGreaterThan(.2);
  await page.locator('#pause').click();
  const paused = await page.locator('#timeline').inputValue();
  await page.waitForTimeout(150);
  expect(await page.locator('#timeline').inputValue()).toBe(paused);
  await page.locator('#timeline').fill('30');
  await expect(page.locator('#stage-title')).toHaveText('Completion');
  await expect(page.locator('#current-time')).toHaveText('00:30');
  for (let i = 0; i < 12; i++) {
    await page.locator('.keyframe').nth(i).click();
    await expect(page.locator('.keyframe').nth(i)).toHaveAttribute('aria-pressed', 'true');
  }
  await page.locator('#transition').selectOption('mask');
  await page.locator('#timeline').fill('14');
  await page.locator('#restart').click();
  await expect(page.locator('#timeline')).toHaveValue('0');
  await expect(page.locator('#pause')).toBeDisabled();
  await page.locator('#fullscreen').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('viewer');
  await page.locator('#exit-fullscreen').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('mobile preserves framing and does not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await page.locator('#viewer').boundingBox();
  expect(box.width / box.height).toBeCloseTo(16 / 9, 2);
  await page.locator('.keyframe').last().click();
  await expect(page.locator('#stage-title')).toHaveText('Completion');
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});

test('custom masks load and playback stops at 30 seconds', async ({ page }) => {
  await page.route('**/src/sequence.js*', async (route) => {
    const response = await route.fetch();
    const source = (await response.text()).replace('mask: null', "mask: 'images/mask-example.svg'");
    await route.fulfill({ response, body: source });
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const maskLoaded = page.waitForResponse('**/images/mask-example.svg');
  await page.goto('/');
  expect((await maskLoaded).status()).toBe(200);
  await expect(page.locator('#loading')).toBeHidden();
  await page.locator('#transition').selectOption('mask');
  await page.locator('#timeline').fill('29.9');
  await page.locator('#play').click();
  await expect(page.locator('#timeline')).toHaveValue('30');
  await expect(page.locator('#pause')).toBeDisabled();
  await page.locator('#play').click();
  await expect.poll(async () => Number(await page.locator('#timeline').inputValue())).toBeLessThan(5);
  expect(errors).toEqual([]);
});
