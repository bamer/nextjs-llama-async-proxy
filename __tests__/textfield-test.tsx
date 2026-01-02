import { render, screen } from "@testing-library/react";
import { TextField } from "@mui/material";

describe("TextField Test", () => {
  it("renders TextField correctly", () => {
    render(
      <TextField
        label="Test"
        name="test"
        value="test"
        onChange={() => {}}
      />
    );
    expect(screen.getByLabelText(/test/i)).toBeInTheDocument();
  });
});
