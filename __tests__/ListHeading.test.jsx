import React from "react";
import { render, screen } from "@testing-library/react-native";
import ListHeading from "../components/ListHeading";

describe("ListHeading", () => {
  test.each(["Upcoming", "All subscription"])("renders the supplied heading %j and View all", async (title) => {
    await render(<ListHeading title={title} />);

    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText("View all")).toBeTruthy();
  });

  test("updates the title without duplicating the action", async () => {
    await render(<ListHeading title="Upcoming" />);
    await screen.rerender(<ListHeading title="All subscription" />);

    expect(screen.queryByText("Upcoming")).toBeNull();
    expect(screen.getByText("All subscription")).toBeTruthy();
    expect(screen.getAllByText("View all")).toHaveLength(1);
  });
});
