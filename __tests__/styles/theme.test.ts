/**
 * Tests for src/styles/theme.ts
 * Objective: Verify theme configuration, design tokens, and theme exports
 */

import { describe, it, expect } from '@jest/globals';
import {
  lightTheme,
  darkTheme,
  designTokens,
} from '@/styles/theme';

describe('src/styles/theme.ts - Theme Configuration', () => {
  describe('designTokens', () => {
    /**
     * Positive Test: Verify designTokens structure
     * Expected result: designTokens should contain colors, spacing, borderRadius, and shadows
     */
    it('should have correct design tokens structure', () => {
      // Act & Assert
      expect(designTokens).toHaveProperty('colors');
      expect(designTokens).toHaveProperty('spacing');
      expect(designTokens).toHaveProperty('borderRadius');
      expect(designTokens).toHaveProperty('shadows');
    });

    /**
     * Positive Test: Verify color tokens are complete
     * Expected result: All color palettes should have 50-900 shades
     */
    it('should have complete color palettes', () => {
      // Arrange
      const colorPalettes = ['primary', 'secondary', 'success', 'warning', 'error', 'gray'] as const;
      const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

      // Act & Assert
      colorPalettes.forEach((palette) => {
        expect(designTokens.colors[palette]).toBeDefined();
        shades.forEach((shade) => {
          const colorKey = String(shade) as '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
          expect(designTokens.colors[palette as keyof typeof designTokens.colors][colorKey]).toBeDefined();
          expect(typeof designTokens.colors[palette as keyof typeof designTokens.colors][colorKey]).toBe('string');
          expect(designTokens.colors[palette as keyof typeof designTokens.colors][colorKey]).toMatch(/^#[0-9a-f]{6}$/i);
        });
      });
    });

    /**
     * Positive Test: Verify spacing tokens
     * Expected result: Spacing tokens should have all expected values
     */
    it('should have correct spacing tokens', () => {
      // Arrange
      const expectedSpacing = {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '2.5rem',
        '3xl': '3rem',
      };

      // Act & Assert
      expect(designTokens.spacing).toEqual(expectedSpacing);
    });

    /**
     * Positive Test: Verify border radius tokens
     * Expected result: Border radius tokens should have all expected values
     */
    it('should have correct border radius tokens', () => {
      // Arrange
      const expectedBorderRadius = {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      };

      // Act & Assert
      expect(designTokens.borderRadius).toEqual(expectedBorderRadius);
    });

    /**
     * Positive Test: Verify shadow tokens
     * Expected result: Shadow tokens should have all expected values
     */
    it('should have correct shadow tokens', () => {
      // Arrange
      const expectedShadows = {
        xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
      };

      // Act & Assert
      expect(designTokens.shadows).toEqual(expectedShadows);
    });
  });

  describe('lightTheme', () => {
    /**
     * Positive Test: Verify lightTheme structure
     * Expected result: lightTheme should be a valid MUI theme
     */
    it('should have correct light theme structure', () => {
      // Act & Assert
      expect(lightTheme).toBeDefined();
      expect(lightTheme.palette).toBeDefined();
      expect(lightTheme.palette.mode).toBe('light');
      expect(lightTheme.typography).toBeDefined();
      expect(lightTheme.components).toBeDefined();
    });

    /**
     * Positive Test: Verify light theme colors use designTokens
     * Expected result: Palette colors should match designTokens
     */
    it('should use designTokens for light theme colors', () => {
      // Act & Assert
      expect(lightTheme.palette.primary.main).toBe(designTokens.colors.primary[500]);
      expect(lightTheme.palette.primary.light).toBe(designTokens.colors.primary[300]);
      expect(lightTheme.palette.primary.dark).toBe(designTokens.colors.primary[700]);

      expect(lightTheme.palette.secondary.main).toBe(designTokens.colors.secondary[500]);
      expect(lightTheme.palette.secondary.light).toBe(designTokens.colors.secondary[300]);
      expect(lightTheme.palette.secondary.dark).toBe(designTokens.colors.secondary[700]);

      expect(lightTheme.palette.success.main).toBe(designTokens.colors.success[500]);
      expect(lightTheme.palette.warning.main).toBe(designTokens.colors.warning[500]);
      expect(lightTheme.palette.error.main).toBe(designTokens.colors.error[500]);
    });

    /**
     * Positive Test: Verify light theme text colors
     * Expected result: Text colors should be appropriate for light mode
     */
    it('should have correct light mode text colors', () => {
      // Act & Assert
      expect(lightTheme.palette.text.primary).toBe('#1e293b');
      expect(lightTheme.palette.text.secondary).toBe('#64748b');
      expect(lightTheme.palette.text.disabled).toBe('#94a3b8');
    });

    /**
     * Positive Test: Verify light theme background colors
     * Expected result: Background colors should be appropriate for light mode
     */
    it('should have correct light mode background colors', () => {
      // Act & Assert
      expect(lightTheme.palette.background.default).toBe('#f8fafc');
      expect(lightTheme.palette.background.paper).toBe('#ffffff');
    });

    /**
     * Positive Test: Verify light theme typography
     * Expected result: Typography should have correct fonts and sizes
     */
    it('should have correct typography configuration', () => {
      // Act & Assert
      expect(lightTheme.typography.fontFamily).toBe('Inter,sans-serif');
      expect(lightTheme.typography.h1?.fontSize).toBe('2.5rem');
      expect(lightTheme.typography.h2?.fontSize).toBe('2rem');
      expect(lightTheme.typography.h3?.fontSize).toBe('1.75rem');
      expect(lightTheme.typography.h4?.fontSize).toBe('1.5rem');
      expect(lightTheme.typography.h5?.fontSize).toBe('1.25rem');
      expect(lightTheme.typography.h6?.fontSize).toBe('1rem');
    });

    /**
     * Positive Test: Verify light theme shape
     * Expected result: Shape should have correct border radius
     */
    it('should have correct shape configuration', () => {
      // Act & Assert
      expect(lightTheme.shape.borderRadius).toBe(12);
    });

    /**
     * Positive Test: Verify light theme components overrides
     * Expected result: Component overrides should be applied
     */
    it('should have component style overrides', () => {
      // Act & Assert
      expect(lightTheme.components?.MuiButton).toBeDefined();
      expect(lightTheme.components?.MuiCard).toBeDefined();
      expect(lightTheme.components?.MuiTextField).toBeDefined();
      expect(lightTheme.components?.MuiSwitch).toBeDefined();
    });

    /**
     * Positive Test: Verify light theme transitions
     * Expected result: Transition durations should be defined
     */
    it('should have transition durations configured', () => {
      // Act & Assert
      expect(lightTheme.transitions.duration).toBeDefined();
      expect(lightTheme.transitions.duration.shortest).toBe(150);
      expect(lightTheme.transitions.duration.standard).toBe(300);
      expect(lightTheme.transitions.duration.complex).toBe(375);
    });
  });

  describe('darkTheme', () => {
    /**
     * Positive Test: Verify darkTheme structure
     * Expected result: darkTheme should be a valid MUI theme
     */
    it('should have correct dark theme structure', () => {
      // Act & Assert
      expect(darkTheme).toBeDefined();
      expect(darkTheme.palette).toBeDefined();
      expect(darkTheme.palette.mode).toBe('dark');
      expect(darkTheme.typography).toBeDefined();
      expect(darkTheme.components).toBeDefined();
    });

    /**
     * Positive Test: Verify dark theme colors use designTokens
     * Expected result: Palette colors should match designTokens (adjusted for dark mode)
     */
    it('should use designTokens for dark theme colors', () => {
      // Act & Assert
      expect(darkTheme.palette.primary.main).toBe(designTokens.colors.primary[400]);
      expect(darkTheme.palette.primary.light).toBe(designTokens.colors.primary[300]);
      expect(darkTheme.palette.primary.dark).toBe(designTokens.colors.primary[600]);

      expect(darkTheme.palette.secondary.main).toBe(designTokens.colors.secondary[400]);
      expect(darkTheme.palette.secondary.light).toBe(designTokens.colors.secondary[300]);
      expect(darkTheme.palette.secondary.dark).toBe(designTokens.colors.secondary[600]);

      expect(darkTheme.palette.success.main).toBe(designTokens.colors.success[400]);
      expect(darkTheme.palette.warning.main).toBe(designTokens.colors.warning[400]);
      expect(darkTheme.palette.error.main).toBe(designTokens.colors.error[400]);
    });

    /**
     * Positive Test: Verify dark theme text colors
     * Expected result: Text colors should be appropriate for dark mode
     */
    it('should have correct dark mode text colors', () => {
      // Act & Assert
      expect(darkTheme.palette.text.primary).toBe('#f1f5f9');
      expect(darkTheme.palette.text.secondary).toBe('#cbd5e1');
      expect(darkTheme.palette.text.disabled).toBe('#94a3b8');
    });

    /**
     * Positive Test: Verify dark theme background colors
     * Expected result: Background colors should be appropriate for dark mode
     */
    it('should have correct dark mode background colors', () => {
      // Act & Assert
      expect(darkTheme.palette.background.default).toBe('#0f172a');
      expect(darkTheme.palette.background.paper).toBe('#1e293b');
    });

    /**
     * Positive Test: Verify dark theme divider colors
     * Expected result: Divider color should be appropriate for dark mode
     */
    it('should have correct dark mode divider color', () => {
      // Act & Assert
      expect(darkTheme.palette.divider).toBe('rgba(255, 255, 255, 0.12)');
    });

    /**
     * Positive Test: Verify dark theme action colors
     * Expected result: Action colors should be appropriate for dark mode
     */
    it('should have correct dark mode action colors', () => {
      // Act & Assert
      expect(darkTheme.palette.action.active).toBe('rgba(255, 255, 255, 0.54)');
      expect(darkTheme.palette.action.hover).toBe('rgba(255, 255, 255, 0.04)');
      expect(darkTheme.palette.action.selected).toBe('rgba(255, 255, 255, 0.08)');
      expect(darkTheme.palette.action.disabled).toBe('rgba(255, 255, 255, 0.26)');
      expect(darkTheme.palette.action.disabledBackground).toBe(
        'rgba(255, 255, 255, 0.12)',
      );
    });
  });

  /**
   * Positive Test: Verify both themes share common configuration
   * Expected result: Both themes should have same typography and components
   */
  it('should share common configuration between light and dark themes', () => {
    // Act & Assert
    expect(lightTheme.typography.fontFamily).toBe(darkTheme.typography.fontFamily);
    expect(lightTheme.shape.borderRadius).toBe(darkTheme.shape.borderRadius);
    expect(lightTheme.components?.MuiButton).toEqual(darkTheme.components?.MuiButton);
    expect(lightTheme.components?.MuiCard).toEqual(darkTheme.components?.MuiCard);
  });

  /**
   * Positive Test: Verify contrast colors are white for all palettes
   * Expected result: All contrast text should be white
   */
  it('should have correct contrast text colors in both themes', () => {
    // Act & Assert
    // Light theme
    expect(lightTheme.palette.primary.contrastText).toBe('#ffffff');
    expect(lightTheme.palette.secondary.contrastText).toBe('#ffffff');
    expect(lightTheme.palette.success.contrastText).toBe('#ffffff');
    expect(lightTheme.palette.warning.contrastText).toBe('#ffffff');
    expect(lightTheme.palette.error.contrastText).toBe('#ffffff');

    // Dark theme
    expect(darkTheme.palette.primary.contrastText).toBe('#ffffff');
    expect(darkTheme.palette.secondary.contrastText).toBe('#ffffff');
    expect(darkTheme.palette.success.contrastText).toBe('#ffffff');
    expect(darkTheme.palette.warning.contrastText).toBe('#ffffff');
    expect(darkTheme.palette.error.contrastText).toBe('#ffffff');
  });

  /**
   * Negative Test: Verify themes are different
   * Expected result: Light and dark themes should have different palette modes
   */
  it('should have different palette modes', () => {
    // Act & Assert
    expect(lightTheme.palette.mode).toBe('light');
    expect(darkTheme.palette.mode).toBe('dark');
    expect(lightTheme.palette.mode).not.toBe(darkTheme.palette.mode);
  });

  /**
   * Positive Test: Verify MuiButton style overrides
   * Expected result: Button overrides should have expected properties
   */
  it('should have correct MuiButton style overrides', () => {
    // Act & Assert
    const buttonOverrides = lightTheme.components?.MuiButton?.styleOverrides?.root as any;
    expect(buttonOverrides?.borderRadius).toBe('8px');
    expect(buttonOverrides?.padding).toBe('8px 24px');
    expect(buttonOverrides?.textTransform).toBe('none');
    expect(buttonOverrides?.transition).toBe('all 0.2s ease');
    expect(buttonOverrides?.['&:hover']).toBeDefined();
  });

  /**
   * Positive Test: Verify MuiCard style overrides
   * Expected result: Card overrides should have expected properties
   */
  it('should have correct MuiCard style overrides', () => {
    // Act & Assert
    const cardOverrides = lightTheme.components?.MuiCard?.styleOverrides?.root as any;
    expect(cardOverrides?.borderRadius).toBe('16px');
    expect(cardOverrides?.boxShadow).toBe('0 4px 20px rgba(0, 0, 0, 0.05)');
    expect(cardOverrides?.transition).toBe('all 0.3s ease');
    expect(cardOverrides?.['&:hover']).toBeDefined();
  });

  /**
   * Positive Test: Verify MuiSwitch style overrides
   * Expected result: Switch overrides should have expected properties
   */
  it('should have correct MuiSwitch style overrides', () => {
    // Act & Assert
    const switchOverrides = lightTheme.components?.MuiSwitch?.styleOverrides as any;
    expect(switchOverrides?.root?.width).toBe(42);
    expect(switchOverrides?.root?.height).toBe(26);
    expect(switchOverrides?.root?.padding).toBe(0);
    expect(switchOverrides?.thumb?.width).toBe(20);
    expect(switchOverrides?.thumb?.height).toBe(20);
  });

  /**
   * Positive Test: Verify typography letter spacing
   * Expected result: Typography should have correct letter spacing
   */
  it('should have correct typography letter spacing', () => {
    // Act & Assert
    expect(lightTheme.typography.h1?.letterSpacing).toBe('-0.02em');
    expect(lightTheme.typography.h2?.letterSpacing).toBe('-0.01em');
    expect(lightTheme.typography.button?.letterSpacing).toBe('0.01em');
    expect(lightTheme.typography.overline?.letterSpacing).toBe('0.05em');
  });

  /**
   * Positive Test: Verify typography font weights
   * Expected result: Typography should have correct font weights
   */
  it('should have correct typography font weights', () => {
    // Act & Assert
    expect(lightTheme.typography.h1?.fontWeight).toBe(700);
    expect(lightTheme.typography.h2?.fontWeight).toBe(600);
    expect(lightTheme.typography.h3?.fontWeight).toBe(600);
    expect(lightTheme.typography.h4?.fontWeight).toBe(600);
    expect(lightTheme.typography.h5?.fontWeight).toBe(600);
    expect(lightTheme.typography.h6?.fontWeight).toBe(600);
    expect(lightTheme.typography.button?.fontWeight).toBe(600);
  });

  /**
   * Positive Test: Verify typography line heights
   * Expected result: Typography should have correct line heights
   */
  it('should have correct typography line heights', () => {
    // Act & Assert
    expect(lightTheme.typography.h1?.lineHeight).toBe(1.2);
    expect(lightTheme.typography.h2?.lineHeight).toBe(1.3);
    expect(lightTheme.typography.h3?.lineHeight).toBe(1.4);
    expect(lightTheme.typography.h4?.lineHeight).toBe(1.4);
    expect(lightTheme.typography.h5?.lineHeight).toBe(1.5);
    expect(lightTheme.typography.h6?.lineHeight).toBe(1.5);
    expect(lightTheme.typography.body1?.lineHeight).toBe(1.6);
    expect(lightTheme.typography.body2?.lineHeight).toBe(1.5);
  });
});
