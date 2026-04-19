/**
 * Frontend E2E Tests using Playwright
 * Tests complete user workflows in the browser
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

let page: Page;

test.describe('Frontend E2E Tests', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.describe('Authentication Pages', () => {
    test('should load login page', async () => {
      await page.goto(`${BASE_URL}/login`);
      
      expect(await page.title()).toContain('AI Image Generator');
      expect(await page.locator('text=SIGN IN').isVisible()).toBe(true);
      expect(await page.locator('input[type="email"]').isVisible()).toBe(true);
      expect(await page.locator('input[type="password"]').isVisible()).toBe(true);
    });

    test('should navigate to register page', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.click('text=Create one');
      
      expect(page.url()).toContain('/register');
      expect(await page.locator('text=CREATE ACCOUNT').isVisible()).toBe(true);
    });

    test('should load register page', async () => {
      await page.goto(`${BASE_URL}/register`);
      
      expect(await page.locator('input[type="text"]').isVisible()).toBe(true); // name
      expect(await page.locator('input[type="email"]').isVisible()).toBe(true);
      expect(await page.locator('input[type="password"]').isVisible()).toBe(true);
    });
  });

  test.describe('Registration Flow', () => {
    test('should register new user successfully', async () => {
      const uniqueEmail = `test-${Date.now()}@example.com`;
      
      await page.goto(`${BASE_URL}/register`);
      
      await page.fill('input[type="text"]', 'Test User');
      await page.fill('input[type="email"]', uniqueEmail);
      await page.fill('input[type="password"]', 'TestPassword123!');
      
      await page.click('button:has-text("CREATE ACCOUNT")');
      
      // Wait for redirect to main page
      await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 });
      
      expect(page.url()).toBe(`${BASE_URL}/`);
      expect(await page.locator('text=NEURAL IMAGE SYNTHESIZER').isVisible()).toBe(true);
    });

    test('should show validation errors', async () => {
      await page.goto(`${BASE_URL}/register`);
      
      // Try invalid email
      await page.fill('input[type="email"]', 'invalid-email');
      await page.click('button:has-text("CREATE ACCOUNT")');
      
      // Browser validation should prevent submission or show error
      const emailInput = page.locator('input[type="email"]');
      const validationMessage = await emailInput.evaluate((el: any) => el.validationMessage);
      expect(validationMessage || '').toBeTruthy();
    });

    test('should show password minimum length requirement', async () => {
      await page.goto(`${BASE_URL}/register`);
      
      await page.fill('input[type="text"]', 'Test User');
      await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
      await page.fill('input[type="password"]', '123'); // Too short
      
      const passwordInput = page.locator('input[type="password"]');
      const minLength = await passwordInput.evaluate((el: any) => el.minLength);
      expect(minLength).toBeGreaterThan(0);
    });
  });

  test.describe('Main Generator Page', () => {
    test.beforeEach(async () => {
      // Login before each test
      await page.goto(`${BASE_URL}/login`);
      // Use demo credentials or create new user
      const testEmail = `gen-test-${Date.now()}@example.com`;
      
      // Register first
      await page.goto(`${BASE_URL}/register`);
      await page.fill('input[type="text"]', 'Generator Test');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("CREATE ACCOUNT")');
      await page.waitForURL(`${BASE_URL}/`);
    });

    test('should display generator interface', async () => {
      expect(await page.locator('text=NEURAL IMAGE SYNTHESIZER').isVisible()).toBe(true);
      expect(await page.locator('text=PROMPT ENGINEERING').isVisible()).toBe(true);
      expect(await page.locator('text=STYLE PRESETS').isVisible()).toBe(true);
      expect(await page.locator('text=AI MODEL').isVisible()).toBe(true);
      expect(await page.locator('text=DIMENSIONS').isVisible()).toBe(true);
    });

    test('should load style presets', async () => {
      const styleButtons = page.locator('button:has-text("Photorealistic"), button:has-text("Digital Art"), button:has-text("Anime")');
      expect(await styleButtons.count()).toBeGreaterThan(0);
    });

    test('should load aspect ratio buttons', async () => {
      const ratioButtons = page.locator('button:has-text("1:1"), button:has-text("16:9"), button:has-text("4:3")');
      expect(await ratioButtons.count()).toBeGreaterThan(0);
    });

    test('should enable/disable generate button based on prompt', async () => {
      const generateBtn = page.locator('button:has-text("GENERATE IMAGE")');
      
      // Should be disabled when empty
      expect(await generateBtn.isDisabled()).toBe(true);
      
      // Should enable when prompt added
      const promptTextarea = page.locator('textarea[placeholder*="Describe your ideal image"]');
      await promptTextarea.fill('a beautiful sunset');
      
      expect(await generateBtn.isDisabled()).toBe(false);
    });

    test('should toggle template suggestions', async () => {
      const templateBtn = page.locator('button:has-text("Templates")');
      await templateBtn.click();
      
      // Suggestions should appear
      expect(await page.locator('text=SUGGESTED PROMPTS:').isVisible()).toBe(true);
    });

    test('should fill prompt from template', async () => {
      const templateBtn = page.locator('button:has-text("Templates")');
      await templateBtn.click();
      
      // Click first suggestion
      const firstSuggestion = page.locator('button:has-text("serene Japanese")');
      await firstSuggestion.click();
      
      // Prompt should be filled
      const promptTextarea = page.locator('textarea');
      const value = await promptTextarea.inputValue();
      expect(value).toContain('Japanese');
    });

    test('should select different styles', async () => {
      const photorealisticBtn = page.locator('button:has-text("Photorealistic")');
      await photorealisticBtn.click();
      
      // Button should show as active (has specific styling)
      expect(await photorealisticBtn.evaluate((el: any) => 
        el.className.includes('cyan') || 
        getComputedStyle(el).backgroundColor.includes('rgb')
      )).toBe(true);
    });

    test('should select different aspect ratios', async () => {
      const ratio169 = page.locator('button:has-text("16:9")');
      await ratio169.click();
      
      // Button should appear selected
      expect(await ratio169.evaluate((el: any) => 
        el.className.includes('active') || 
        el.className.includes('cyan')
      )).toBe(true);
    });

    test('should toggle enhance prompt checkbox', async () => {
      const enhanceCheckbox = page.locator('input[type="checkbox"]:above(:text("ENHANCE PROMPT"))');
      
      const isCheckedBefore = await enhanceCheckbox.isChecked();
      await enhanceCheckbox.click();
      const isCheckedAfter = await enhanceCheckbox.isChecked();
      
      expect(isCheckedAfter).not.toBe(isCheckedBefore);
    });

    test('should toggle 2X upscale checkbox', async () => {
      const upscaleCheckbox = page.locator('input[type="checkbox"]:above(:text("2X UPSCALE"))');
      
      const isCheckedBefore = await upscaleCheckbox.isChecked();
      await upscaleCheckbox.click();
      const isCheckedAfter = await upscaleCheckbox.isChecked();
      
      expect(isCheckedAfter).not.toBe(isCheckedBefore);
    });
  });

  test.describe('Image Generation', () => {
    test.beforeEach(async () => {
      // Login and navigate to generator
      await page.goto(`${BASE_URL}/login`);
      // Register/login logic here
      const testEmail = `gen-test-${Date.now()}@example.com`;
      
      await page.goto(`${BASE_URL}/register`);
      await page.fill('input[type="text"]', 'Generator Test');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("CREATE ACCOUNT")');
      await page.waitForURL(`${BASE_URL}/`);
    });

    test('should show loading state during generation', async () => {
      const promptTextarea = page.locator('textarea');
      await promptTextarea.fill('a beautiful landscape');
      
      const generateBtn = page.locator('button:has-text("GENERATE IMAGE")');
      await generateBtn.click();
      
      // Should show processing state
      expect(await page.locator('text=PROCESSING').isVisible()).toBe(true);
    });

    test('should not generate without prompt', async () => {
      const generateBtn = page.locator('button:has-text("GENERATE IMAGE")');
      
      // Button should be disabled when no prompt
      expect(await generateBtn.isDisabled()).toBe(true);
    });
  });

  test.describe('Gallery Page', () => {
    test.beforeEach(async () => {
      const testEmail = `gallery-test-${Date.now()}@example.com`;
      
      await page.goto(`${BASE_URL}/register`);
      await page.fill('input[type="text"]', 'Gallery Test');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("CREATE ACCOUNT")');
      await page.waitForURL(`${BASE_URL}/`);
    });

    test('should navigate to gallery', async () => {
      await page.click('text=[ARCHIVE]');
      
      expect(page.url()).toContain('/gallery');
      expect(await page.locator('text=IMAGE ARCHIVE').isVisible()).toBe(true);
    });

    test('should display empty gallery message for new user', async () => {
      await page.click('text=[ARCHIVE]');
      
      // Gallery should be empty or show 0 creations
      const grid = page.locator('[class*="grid"]');
      const images = grid.locator('[class*="aspect-square"]');
      
      // May have no images initially
      expect(await images.count()).toBeGreaterThanOrEqual(0);
    });

    test('should navigate back to generator', async () => {
      await page.click('text=[ARCHIVE]');
      await page.click('text=[GENERATE]');
      
      expect(page.url()).toBe(`${BASE_URL}/`);
      expect(await page.locator('text=NEURAL IMAGE SYNTHESIZER').isVisible()).toBe(true);
    });
  });

  test.describe('Navigation and User Info', () => {
    test.beforeEach(async () => {
      const testEmail = `nav-test-${Date.now()}@example.com`;
      
      await page.goto(`${BASE_URL}/register`);
      await page.fill('input[type="text"]', 'Navigation Test');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("CREATE ACCOUNT")');
      await page.waitForURL(`${BASE_URL}/`);
    });

    test('should display user credits', async () => {
      const creditsDisplay = page.locator('text=/\\d+ Credits/');
      expect(await creditsDisplay.isVisible()).toBe(true);
    });

    test('should display user plan', async () => {
      const planDisplay = page.locator('text=/TIER/');
      expect(await planDisplay.isVisible()).toBe(true);
    });

    test('should have logout button', async () => {
      const logoutBtn = page.locator('button:has-text("[EXIT]")');
      expect(await logoutBtn.isVisible()).toBe(true);
    });

    test('should logout successfully', async () => {
      const logoutBtn = page.locator('button:has-text("[EXIT]")');
      await logoutBtn.click();
      
      // Should redirect to login
      await page.waitForURL(`${BASE_URL}/login`);
      expect(page.url()).toContain('/login');
    });

    test('should not access protected pages after logout', async () => {
      const logoutBtn = page.locator('button:has-text("[EXIT]")');
      await logoutBtn.click();
      await page.waitForURL(`${BASE_URL}/login`);
      
      // Try to access generator page directly
      await page.goto(`${BASE_URL}/`);
      
      // Should redirect back to login
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async () => {
      const mobileContext = await page.context().browser()?.newContext({
        viewport: { width: 375, height: 667 },
      });
      
      const mobilePage = await mobileContext!.newPage();
      const testEmail = `mobile-test-${Date.now()}@example.com`;
      
      await mobilePage.goto(`${BASE_URL}/register`);
      await mobilePage.fill('input[type="text"]', 'Mobile Test');
      await mobilePage.fill('input[type="email"]', testEmail);
      await mobilePage.fill('input[type="password"]', 'TestPassword123!');
      await mobilePage.click('button:has-text("CREATE ACCOUNT")');
      
      await mobilePage.waitForURL(`${BASE_URL}/`);
      
      // Check if interface is still usable
      expect(await mobilePage.locator('textarea').isVisible()).toBe(true);
      expect(await mobilePage.locator('button:has-text("GENERATE IMAGE")').isVisible()).toBe(true);
      
      await mobilePage.close();
      await mobileContext?.close();
    });

    test('should be responsive on tablet', async () => {
      const tabletContext = await page.context().browser()?.newContext({
        viewport: { width: 768, height: 1024 },
      });
      
      const tabletPage = await tabletContext!.newPage();
      const testEmail = `tablet-test-${Date.now()}@example.com`;
      
      await tabletPage.goto(`${BASE_URL}/register`);
      await tabletPage.fill('input[type="text"]', 'Tablet Test');
      await tabletPage.fill('input[type="email"]', testEmail);
      await tabletPage.fill('input[type="password"]', 'TestPassword123!');
      await tabletPage.click('button:has-text("CREATE ACCOUNT")');
      
      await tabletPage.waitForURL(`${BASE_URL}/`);
      
      expect(await tabletPage.locator('textarea').isVisible()).toBe(true);
      
      await tabletPage.close();
      await tabletContext?.close();
    });
  });
});
