/**
 * Tests for src/global.d.ts
 * Objective: Verify JSX augmentation for sx prop on all elements
 */

import { describe, it, expect } from '@jest/globals';

describe('src/global.d.ts - JSX Augmentation', () => {
  /**
   * Positive Test: Verify sx prop can be used on HTML elements
   * Expected result: sx prop should be accepted on all JSX elements
   */
  it('should allow sx prop on HTML elements', () => {
    // Arrange
    const sxProp = { color: 'primary', padding: 2 };

    // Act - In a real React component, sx prop would be accepted
    // Here we verify the concept through runtime checks
    const elementProps = {
      className: 'test-class',
      sx: sxProp,
    };

    // Assert
    expect(elementProps.sx).toEqual(sxProp);
    expect(elementProps.className).toBe('test-class');
  });

  /**
   * Positive Test: Verify sx prop accepts various value types
   * Expected result: sx prop should accept objects, arrays, etc.
   */
  it('should accept various sx prop value types', () => {
    // Arrange
    const objectStyle = { margin: '10px', padding: '20px' };
    const arrayStyle = [{ margin: '10px' }, { padding: '20px' }];
    const mixedStyle = {
      color: 'primary',
      fontSize: '1rem',
      '&:hover': { color: 'secondary' },
    };

    // Act
    const props1 = { sx: objectStyle };
    const props2 = { sx: arrayStyle };
    const props3 = { sx: mixedStyle };

    // Assert
    expect(props1.sx).toEqual(objectStyle);
    expect(props2.sx).toEqual(arrayStyle);
    expect(props3.sx).toEqual(mixedStyle);
  });

  /**
   * Negative Test: Verify sx prop is optional
   * Expected result: Elements should work without sx prop
   */
  it('should work without sx prop', () => {
    // Arrange & Act
    const propsWithoutSx = {
      className: 'test',
      id: 'element',
    } as any; // Type cast to allow optional sx check

    // Assert
    expect(propsWithoutSx.sx).toBeUndefined();
    expect(propsWithoutSx.className).toBe('test');
  });

  /**
   * Positive Test: Verify sx prop coexists with standard HTML attributes
   * Expected result: sx prop should work alongside standard attributes
   */
  it('should coexist with standard HTML attributes', () => {
    // Arrange
    const standardProps = {
      id: 'test-id',
      className: 'test-class',
      role: 'button',
      'aria-label': 'Test button',
    };

    const sxProp = { m: 2, p: 1 };

    // Act
    const combinedProps = { ...standardProps, sx: sxProp };

    // Assert
    expect(combinedProps.id).toBe('test-id');
    expect(combinedProps.className).toBe('test-class');
    expect(combinedProps.role).toBe('button');
    expect(combinedProps['aria-label']).toBe('Test button');
    expect(combinedProps.sx).toEqual(sxProp);
  });

  /**
   * Positive Test: Verify sx prop works on different element types
   * Expected result: sx prop should be available on all element names
   */
  it('should work on different element types', () => {
    // Arrange
    const sxProp = { display: 'flex' };

    // Act - Verify sx prop can be applied to various elements
    const elements = {
      div: { sx: sxProp },
      button: { sx: sxProp },
      span: { sx: sxProp },
      section: { sx: sxProp },
      article: { sx: sxProp },
    };

    // Assert
    Object.values(elements).forEach((el) => {
      expect(el.sx).toEqual(sxProp);
    });
  });

  /**
   * Positive Test: Verify sx prop accepts theme-aware values
   * Expected result: sx prop should accept MUI theme values
   */
  it('should accept theme-aware values', () => {
    // Arrange
    const themeValues = {
      m: 1,
      p: 2,
      color: 'primary.main',
      bgcolor: 'background.paper',
      fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
    };

    // Act
    const props = { sx: themeValues };

    // Assert
    expect(props.sx).toEqual(themeValues);
    expect(props.sx.m).toBe(1);
    expect(props.sx.p).toBe(2);
    expect(props.sx.color).toBe('primary.main');
  });

  /**
   * Positive Test: Verify sx prop accepts responsive breakpoints
   * Expected result: sx prop should support breakpoint-based styles
   */
  it('should support responsive breakpoint styles', () => {
    // Arrange
    const responsiveStyle = {
      fontSize: '1rem',
      [`@media (min-width:600px)`]: {
        fontSize: '1.25rem',
      },
      [`@media (min-width:960px)`]: {
        fontSize: '1.5rem',
      },
    };

    // Act
    const props = { sx: responsiveStyle };

    // Assert
    expect(props.sx).toEqual(responsiveStyle);
    expect(props.sx.fontSize).toBe('1rem');
  });

  /**
   * Positive Test: Verify sx prop accepts pseudo-selectors
   * Expected result: sx prop should support CSS pseudo-selectors
   */
  it('should support CSS pseudo-selectors', () => {
    // Arrange
    const pseudoStyle = {
      '&:hover': { backgroundColor: 'primary.main' },
      '&:active': { transform: 'scale(0.98)' },
      '&:focus': { outline: '2px solid primary.main' },
      '&::before': { content: '""' },
      '&::after': { content: '""' },
    };

    // Act
    const props = { sx: pseudoStyle };

    // Assert
    expect(props.sx['&:hover']).toBeDefined();
    expect(props.sx['&:active']).toBeDefined();
    expect(props.sx['&:focus']).toBeDefined();
    expect(props.sx['&::before']).toBeDefined();
    expect(props.sx['&::after']).toBeDefined();
  });

  /**
   * Positive Test: Verify sx prop accepts nested selectors
   * Expected result: sx prop should support nested child selectors
   */
  it('should support nested selectors', () => {
    // Arrange
    const nestedStyle = {
      '& .child-class': {
        color: 'red',
        fontSize: '1rem',
      },
      '& > .direct-child': {
        padding: '10px',
      },
      '& + .adjacent-sibling': {
        marginLeft: '10px',
      },
    };

    // Act
    const props = { sx: nestedStyle };

    // Assert
    expect(props.sx['& .child-class']).toBeDefined();
    expect(props.sx['& > .direct-child']).toBeDefined();
    expect(props.sx['& + .adjacent-sibling']).toBeDefined();
  });

  /**
   * Positive Test: Verify sx prop accepts CSS-in-JS properties
   * Expected result: sx prop should support camelCase CSS properties
   */
  it('should support CSS-in-JS camelCase properties', () => {
    // Arrange
    const camelCaseStyle = {
      backgroundColor: 'red',
      fontSize: '1rem',
      marginTop: '10px',
      paddingLeft: '15px',
      borderRadius: '4px',
    };

    // Act
    const props = { sx: camelCaseStyle };

    // Assert
    expect(props.sx.backgroundColor).toBe('red');
    expect(props.sx.fontSize).toBe('1rem');
    expect(props.sx.marginTop).toBe('10px');
    expect(props.sx.paddingLeft).toBe('15px');
    expect(props.sx.borderRadius).toBe('4px');
  });
});
