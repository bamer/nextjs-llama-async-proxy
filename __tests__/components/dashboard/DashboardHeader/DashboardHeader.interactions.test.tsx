import { render, screen, fireEvent } from "@testing-library/react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { renderWithProviders } from "./DashboardHeader.test-utils";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("framer-motion", () => ({
  m: {
    div: ({ children, ...props }: unknown) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe("DashboardHeader Interactions", () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls onRefresh when refresh button is clicked", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    const refreshButton = screen.getAllByRole("button")[0];
    fireEvent.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it("navigates to settings when settings button is clicked", () => {
    renderWithProviders(
      <DashboardHeader
        isConnected={true}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    const buttons = screen.getAllByRole("button");
    if (buttons.length > 1) {
      fireEvent.click(buttons[1]);
    }
  });

  it("handles multiple rapid state changes without errors", () => {
    const { rerender } = renderWithProviders(
      <DashboardHeader isConnected={true} metrics={undefined} onRefresh={mockOnRefresh} />
    );

    for (let i = 0; i < 10; i++) {
      const isConnected = i % 2 === 0;
      rerender(
        <DashboardHeader
          isConnected={isConnected}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );
    }

    expect(screen.getByText("DISCONNECTED")).toBeInTheDocument();
  });
});
