import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Card from "@/components/ui/Card";

jest.mock("@mui/material/Box", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => {
    const { sx, ...rest } = props;
    return <div {...rest}>{children}</div>;
  },
}));

jest.mock("@mui/material/Card", () => ({
  __esModule: true,
  Card: ({ children, ...props }: any) => {
    const { sx, ...rest } = props;
    return (
      <div {...rest} className="MuiCard-root">
        {children}
      </div>
    );
  },
}));

jest.mock("@mui/material/CardContent", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => {
    const { sx, ...rest } = props;
    return (
      <div {...rest} className="MuiCardContent-root">
        {children}
      </div>
    );
  },
}));

jest.mock("@mui/material/CardActions", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => {
    const { sx, ...rest } = props;
    return (
      <div {...rest} className="MuiCardActions-root">
        {children}
      </div>
    );
  },
}));

jest.mock("@mui/material/Button", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => {
    const { sx, ...rest } = props;
    return <button {...rest}>{children}</button>;
  },
}));

jest.mock("@mui/material/Typography", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => {
    const { sx, ...rest } = props;
    return <span {...rest}>{children}</span>;
  },
}));

describe("Card (MUI Component)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with default content", () => {
    render(<Card />);
    expect(screen.getByText("Word of the Day")).toBeInTheDocument();
  });

  it("renders word with bullet points", () => {
    render(<Card />);
    const renderedTexts = screen.getAllByText(/ben/);
    expect(renderedTexts.length).toBeGreaterThan(0);
  });

  it("renders 'adjective' text", () => {
    render(<Card />);
    expect(screen.getByText("adjective")).toBeInTheDocument();
  });

  it("renders definition text", () => {
    render(<Card />);
    const definitionText = screen.getByText(/well meaning and kindly/);
    expect(definitionText).toBeInTheDocument();
  });

  it("renders example quote", () => {
    render(<Card />);
    expect(screen.getByText(/a benevolent smile/)).toBeInTheDocument();
  });

  it("has a 'Learn More' button", () => {
    render(<Card />);
    const button = screen.getByText("Learn More");
    expect(button).toBeInTheDocument();
  });

  it("button renders as button element", () => {
    render(<Card />);
    const button = screen.getByText("Learn More");
    expect(button.tagName.toLowerCase()).toBe("button");
  });

  it("has MuiCard-root class", () => {
    const { container } = render(<Card />);
    const card = container.querySelector('[class*="MuiCard-root"]');
    expect(card).toBeInTheDocument();
  });

  it("renders with correct CardContent structure", () => {
    render(<Card />);
    const cardContent = document.querySelector(".MuiCardContent-root");
    expect(cardContent).toBeInTheDocument();
  });

  it("renders with CardActions", () => {
    render(<Card />);
    const button = screen.getByText("Learn More");
    expect(button.closest('[class*="MuiCardActions-root"]')).toBeInTheDocument();
  });

  it("uses MuiMaterial components correctly", () => {
    render(<Card />);
    expect(screen.getByText("Word of the Day")).toBeInTheDocument();
    expect(screen.getByText("Learn More")).toBeInTheDocument();
  });

  it("has proper text structure", () => {
    render(<Card />);
    const word = screen.getAllByText(/ben/)[0];
    const subtitle = screen.getByText("adjective");
    const body = screen.getByText(/well meaning/);

    expect(word).toBeInTheDocument();
    expect(subtitle).toBeInTheDocument();
    expect(body).toBeInTheDocument();
  });

  it("has correct span elements from mocked Typography", () => {
    const { container } = render(<Card />);
    const spanElements = container.querySelectorAll("span");
    expect(spanElements.length).toBeGreaterThan(0);
  });
});
