import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarProvider';

describe('SidebarProvider', () => {
  it('renders children correctly', () => {
    render(
      <SidebarProvider>
        <div data-testid="test-child">Test Content</div>
      </SidebarProvider>
    );
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('provides context value to children', () => {
    const TestComponent = () => {
      const sidebar = useSidebar();
      return (
        <div>
          <span data-testid="is-open">{String(sidebar.isOpen)}</span>
          <button onClick={sidebar.toggleSidebar} data-testid="toggle">Toggle</button>
          <button onClick={sidebar.openSidebar} data-testid="open">Open</button>
          <button onClick={sidebar.closeSidebar} data-testid="close">Close</button>
        </div>
      );
    };

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
  });

  it('initializes with isOpen as false', () => {
    const TestComponent = () => {
      const { isOpen } = useSidebar();
      return <span data-testid="is-open">{String(isOpen)}</span>;
    };

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
  });

  it('toggles sidebar state when toggleSidebar is called', () => {
    const TestComponent = () => {
      const sidebar = useSidebar();
      return (
        <div>
          <span data-testid="is-open">{String(sidebar.isOpen)}</span>
          <button onClick={sidebar.toggleSidebar} data-testid="toggle">Toggle</button>
        </div>
      );
    };

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const toggleButton = screen.getByTestId('toggle');
    const isOpenSpan = screen.getByTestId('is-open');

    expect(isOpenSpan).toHaveTextContent('false');

    act(() => {
      toggleButton.click();
    });
    expect(isOpenSpan).toHaveTextContent('true');

    act(() => {
      toggleButton.click();
    });
    expect(isOpenSpan).toHaveTextContent('false');
  });

  it('opens sidebar when openSidebar is called', () => {
    const TestComponent = () => {
      const sidebar = useSidebar();
      return (
        <div>
          <span data-testid="is-open">{String(sidebar.isOpen)}</span>
          <button onClick={sidebar.openSidebar} data-testid="open">Open</button>
        </div>
      );
    };

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const openButton = screen.getByTestId('open');
    const isOpenSpan = screen.getByTestId('is-open');

    expect(isOpenSpan).toHaveTextContent('false');

    act(() => {
      openButton.click();
    });
    expect(isOpenSpan).toHaveTextContent('true');
  });

  it('closes sidebar when closeSidebar is called', () => {
    const TestComponent = () => {
      const sidebar = useSidebar();
      return (
        <div>
          <span data-testid="is-open">{String(sidebar.isOpen)}</span>
          <button onClick={sidebar.openSidebar} data-testid="open">Open</button>
          <button onClick={sidebar.closeSidebar} data-testid="close">Close</button>
        </div>
      );
    };

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const openButton = screen.getByTestId('open');
    const closeButton = screen.getByTestId('close');
    const isOpenSpan = screen.getByTestId('is-open');

    act(() => {
      openButton.click();
    });
    expect(isOpenSpan).toHaveTextContent('true');

    act(() => {
      closeButton.click();
    });
    expect(isOpenSpan).toHaveTextContent('false');
  });

  it('maintains state across re-renders', () => {
    const TestComponent = () => {
      const sidebar = useSidebar();
      return (
        <div>
          <span data-testid="is-open">{String(sidebar.isOpen)}</span>
          <button onClick={sidebar.toggleSidebar} data-testid="toggle">Toggle</button>
        </div>
      );
    };

    const { rerender } = render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    const toggleButton = screen.getByTestId('toggle');
    const isOpenSpan = screen.getByTestId('is-open');

    expect(isOpenSpan).toHaveTextContent('false');

    act(() => {
      toggleButton.click();
    });
    expect(isOpenSpan).toHaveTextContent('true');

    rerender(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    expect(isOpenSpan).toHaveTextContent('true');
  });

  it('provides all required methods', () => {
    const TestComponent = () => {
      const sidebar = useSidebar();
      return (
        <div>
          <button onClick={sidebar.toggleSidebar}>Toggle</button>
          <button onClick={sidebar.openSidebar}>Open</button>
          <button onClick={sidebar.closeSidebar}>Close</button>
        </div>
      );
    };

    expect(() => {
      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );
    }).not.toThrow();
  });

  it('throws error when useSidebar is used outside SidebarProvider', () => {
    const TestComponent = () => {
      const sidebar = useSidebar();
      return <div>{String(sidebar.isOpen)}</div>;
    };

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSidebar must be used within SidebarProvider');
  });

  describe('Edge Cases', () => {
    it('handles null children gracefully', () => {
      expect(() => {
        render(
          <SidebarProvider>
            {null}
          </SidebarProvider>
        );
      }).not.toThrow();
    });

    it('handles undefined children gracefully', () => {
      expect(() => {
        render(
          <SidebarProvider>
            {undefined}
          </SidebarProvider>
        );
      }).not.toThrow();
    });

    it('handles false children', () => {
      expect(() => {
        render(
          <SidebarProvider>
            {false}
          </SidebarProvider>
        );
      }).not.toThrow();
    });

    it('handles true children', () => {
      expect(() => {
        render(
          <SidebarProvider>
            {true}
          </SidebarProvider>
        );
      }).not.toThrow();
    });

    it('handles zero children', () => {
      expect(() => {
        render(
          <SidebarProvider>
            {0}
          </SidebarProvider>
        );
      }).not.toThrow();
    });

    it('handles empty string children', () => {
      render(
        <SidebarProvider>
          {''}
        </SidebarProvider>
      );
      // Should render without errors
    });

    it('handles children as fragments', () => {
      render(
        <SidebarProvider>
          <React.Fragment>
            <div data-testid="frag-1">Fragment 1</div>
            <div data-testid="frag-2">Fragment 2</div>
          </React.Fragment>
        </SidebarProvider>
      );

      expect(screen.getByTestId('frag-1')).toBeInTheDocument();
      expect(screen.getByTestId('frag-2')).toBeInTheDocument();
    });

    it('handles children as arrays', () => {
      render(
        <SidebarProvider>
          {[
            <div key="1" data-testid="arr-1">
              Array 1
            </div>,
            <div key="2" data-testid="arr-2">
              Array 2
            </div>,
          ]}
        </SidebarProvider>
      );

      expect(screen.getByTestId('arr-1')).toBeInTheDocument();
      expect(screen.getByTestId('arr-2')).toBeInTheDocument();
    });

    it('handles very deep nested children', () => {
      const DeepNestedComponent = () => (
        <div data-testid="deep-nested">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} data-testid={`level-${i}`}>
              Level {i}
            </div>
          ))}
        </div>
      );

      render(
        <SidebarProvider>
          <DeepNestedComponent />
        </SidebarProvider>
      );

      expect(screen.getByTestId('deep-nested')).toBeInTheDocument();
      expect(screen.getByTestId('level-0')).toBeInTheDocument();
      expect(screen.getByTestId('level-49')).toBeInTheDocument();
    });

    it('handles children with special characters', () => {
      const specialChars = 'Special: !@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      render(
        <SidebarProvider>
          <div data-testid="special-chars">{specialChars}</div>
        </SidebarProvider>
      );

      expect(screen.getByTestId('special-chars')).toBeInTheDocument();
    });

    it('handles children with very long text content', () => {
      const longText = 'A'.repeat(10000);
      render(
        <SidebarProvider>
          <div data-testid="long-text">{longText}</div>
        </SidebarProvider>
      );

      expect(screen.getByTestId('long-text')).toBeInTheDocument();
    });

    it('handles children with Unicode characters', () => {
      const unicodeText = 'Hello 世界 🌍 Привет مرحبا';
      render(
        <SidebarProvider>
          <div data-testid="unicode">{unicodeText}</div>
        </SidebarProvider>
      );

      expect(screen.getByTestId('unicode')).toBeInTheDocument();
    });

    it('handles rapid state changes without errors', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="toggle">
              Toggle
            </button>
          </div>
        );
      };

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const toggleButton = screen.getByTestId('toggle');

      // Rapid toggles
      for (let i = 0; i < 50; i++) {
        act(() => {
          toggleButton.click();
        });
      }

      expect(toggleButton).toBeInTheDocument();
    });

    it('handles concurrent toggle, open, and close operations', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="toggle">
              Toggle
            </button>
            <button onClick={sidebar.openSidebar} data-testid="open">
              Open
            </button>
            <button onClick={sidebar.closeSidebar} data-testid="close">
              Close
            </button>
          </div>
        );
      };

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const toggleButton = screen.getByTestId('toggle');
      const openButton = screen.getByTestId('open');
      const closeButton = screen.getByTestId('close');

      // Random sequence of operations
      act(() => {
        openButton.click();
        closeButton.click();
        toggleButton.click();
        openButton.click();
        toggleButton.click();
      });

      expect(toggleButton).toBeInTheDocument();
    });

    it('handles state updates during rapid renders', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        const [, forceUpdate] = React.useState(0);

        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="toggle">
              Toggle
            </button>
            <button onClick={() => forceUpdate((x) => x + 1)} data-testid="force-update">
              Force Update
            </button>
          </div>
        );
      };

      const { container } = render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const toggleButton = screen.getByTestId('toggle');
      const forceUpdateButton = screen.getByTestId('force-update');

      // Mix of state updates and renders
      for (let i = 0; i < 20; i++) {
        act(() => {
          forceUpdateButton.click();
          if (i % 3 === 0) {
            toggleButton.click();
          }
        });
      }

      expect(container).toBeInTheDocument();
    });

    it('handles children with event handlers', () => {
      const handleClick = jest.fn();

      render(
        <SidebarProvider>
          <button data-testid="clickable" onClick={handleClick}>
            Click me
          </button>
        </SidebarProvider>
      );

      const button = screen.getByTestId('clickable');
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles children that throw errors (should not crash provider)', () => {
      const ThrowingChild = () => {
        const sidebar = useSidebar();
        if (sidebar.isOpen) {
          throw new Error('Child error');
        }
        return <div>Safe Child</div>;
      };

      // This will throw, but SidebarProvider itself should not crash
      expect(() => {
        render(
          <SidebarProvider>
            <ThrowingChild />
          </SidebarProvider>
        );
      }).toThrow();
    });

    it('handles multiple children using context', () => {
      const Child1 = () => {
        const sidebar = useSidebar();
        return (
          <div data-testid="child-1">
            <span data-testid="child-1-is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="child-1-toggle">
              Toggle
            </button>
          </div>
        );
      };

      const Child2 = () => {
        const sidebar = useSidebar();
        return (
          <div data-testid="child-2">
            <span data-testid="child-2-is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="child-2-toggle">
              Toggle
            </button>
          </div>
        );
      };

      render(
        <SidebarProvider>
          <Child1 />
          <Child2 />
        </SidebarProvider>
      );

      const child1IsOpen = screen.getByTestId('child-1-is-open');
      const child2IsOpen = screen.getByTestId('child-2-is-open');

      expect(child1IsOpen).toHaveTextContent('false');
      expect(child2IsOpen).toHaveTextContent('false');

      // Toggle from child 1
      act(() => {
        screen.getByTestId('child-1-toggle').click();
      });

      expect(child1IsOpen).toHaveTextContent('true');
      expect(child2IsOpen).toHaveTextContent('true');
    });

    it('handles context updates correctly', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="toggle">
              Toggle
            </button>
            <button onClick={sidebar.openSidebar} data-testid="open">
              Open
            </button>
            <button onClick={sidebar.closeSidebar} data-testid="close">
              Close
            </button>
          </div>
        );
      };

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const isOpenSpan = screen.getByTestId('is-open');
      const toggleButton = screen.getByTestId('toggle');
      const openButton = screen.getByTestId('open');
      const closeButton = screen.getByTestId('close');

      // Open
      act(() => {
        openButton.click();
      });
      expect(isOpenSpan).toHaveTextContent('true');

      // Toggle (should close)
      act(() => {
        toggleButton.click();
      });
      expect(isOpenSpan).toHaveTextContent('false');

      // Toggle (should open)
      act(() => {
        toggleButton.click();
      });
      expect(isOpenSpan).toHaveTextContent('true');

      // Close
      act(() => {
        closeButton.click();
      });
      expect(isOpenSpan).toHaveTextContent('false');
    });
  });

  describe('Accessibility Edge Cases', () => {
    it('handles context access in screen readers', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <button
              onClick={sidebar.toggleSidebar}
              aria-label="Toggle sidebar"
              data-testid="toggle"
            >
              Toggle
            </button>
          </div>
        );
      };

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const toggleButton = screen.getByTestId('toggle');
      expect(toggleButton).toHaveAttribute('aria-label', 'Toggle sidebar');
    });

    it('handles keyboard navigation through context-controlled elements', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <button
              onClick={sidebar.toggleSidebar}
              onKeyDown={(e) => e.key === 'Enter' && sidebar.toggleSidebar()}
              data-testid="toggle"
            >
              Toggle
            </button>
          </div>
        );
      };

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const toggleButton = screen.getByTestId('toggle');
      fireEvent.keyDown(toggleButton, { key: 'Enter', code: 'Enter' });
      expect(toggleButton).toBeInTheDocument();
    });

    it('handles focus management with context', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <button
              onClick={sidebar.toggleSidebar}
              data-testid="toggle"
            >
              Toggle
            </button>
          </div>
        );
      };

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const toggleButton = screen.getByTestId('toggle');
      fireEvent.focus(toggleButton);
      expect(toggleButton).toBeInTheDocument();

      fireEvent.blur(toggleButton);
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Collapsing/Expanding Edge Cases', () => {
    it('handles repeated open/close cycles', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.openSidebar} data-testid="open">
              Open
            </button>
            <button onClick={sidebar.closeSidebar} data-testid="close">
              Close
            </button>
          </div>
        );
      };

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const openButton = screen.getByTestId('open');
      const closeButton = screen.getByTestId('close');
      const isOpenSpan = screen.getByTestId('is-open');

      // Repeated open/close cycles
      for (let i = 0; i < 30; i++) {
        act(() => {
          openButton.click();
          closeButton.click();
        });
      }

      expect(isOpenSpan).toHaveTextContent('false');
    });

    it('handles calling open when already open', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.openSidebar} data-testid="open">
              Open
            </button>
          </div>
        );
      };

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const openButton = screen.getByTestId('open');
      const isOpenSpan = screen.getByTestId('is-open');

      act(() => {
        openButton.click();
      });
      expect(isOpenSpan).toHaveTextContent('true');

      // Call open again when already open
      act(() => {
        openButton.click();
      });
      expect(isOpenSpan).toHaveTextContent('true');
    });

    it('handles calling close when already closed', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.closeSidebar} data-testid="close">
              Close
            </button>
          </div>
        );
      };

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const closeButton = screen.getByTestId('close');
      const isOpenSpan = screen.getByTestId('is-open');

      // Close when already closed
      act(() => {
        closeButton.click();
      });
      expect(isOpenSpan).toHaveTextContent('false');

      act(() => {
        closeButton.click();
      });
      expect(isOpenSpan).toHaveTextContent('false');
    });

    it('handles toggle in rapid succession from both open and closed states', () => {
      const TestComponent = () => {
        const sidebar = useSidebar();
        return (
          <div>
            <span data-testid="is-open">{String(sidebar.isOpen)}</span>
            <button onClick={sidebar.toggleSidebar} data-testid="toggle">
              Toggle
            </button>
          </div>
        );
      };

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      );

      const toggleButton = screen.getByTestId('toggle');
      const isOpenSpan = screen.getByTestId('is-open');

      // Open first
      act(() => {
        toggleButton.click();
      });
      expect(isOpenSpan).toHaveTextContent('true');

      // Rapid toggles
      for (let i = 0; i < 20; i++) {
        act(() => {
          toggleButton.click();
        });
      }

      // Should be closed (odd number of toggles from open state)
      expect(isOpenSpan).toHaveTextContent('false');
    });
  });
});
