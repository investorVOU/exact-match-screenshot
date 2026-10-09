import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");

  return {
    ...actual,
    Link: ({ children, to, ...props }: any) => <a href={typeof to === "string" ? to : "/"} {...props}>{children}</a>,
  };
});

import { CarCard } from "@/components/site";

describe("homepage car card", () => {
  it("does not render the mileage unit label", () => {
    const car = {
      id: "car-1",
      slug: "toyota-corolla-2021",
      make: "Toyota",
      model: "Corolla",
      year: 2021,
      price: 25000000,
      mileage: 123456,
      transmission: "Automatic",
      fuel: "Petrol",
      body_type: "Sedan",
      condition: "Foreign Used",
      color: "Black",
      engine_size: "1.8L",
      location: "Abuja",
      description: "Great condition",
      status: "Available",
      images: ["https://example.com/car.jpg"],
    };

    render(<CarCard car={car} />);

    expect(screen.getByText(/123,456/i)).toBeInTheDocument();
    expect(screen.getByText(/Automatic/i)).toBeInTheDocument();
    expect(screen.queryByText(/km/i)).not.toBeInTheDocument();
  });

  it("hides mileage when it is zero or empty", () => {
    const car = {
      id: "car-2",
      slug: "honda-civic-2020",
      make: "Honda",
      model: "Civic",
      year: 2020,
      price: 18000000,
      mileage: 0,
      transmission: "Automatic",
      fuel: "Petrol",
      body_type: "Sedan",
      condition: "Nigerian Used",
      color: "Silver",
      engine_size: "1.5L",
      location: "Lagos",
      description: "Good condition",
      status: "Available",
      images: ["https://example.com/honda.jpg"],
    };

    render(<CarCard car={car} />);

    expect(screen.getByText(/^Automatic$/i)).toBeInTheDocument();
    expect(screen.queryByText("0 · Automatic")).not.toBeInTheDocument();
    expect(screen.queryByText(/km/i)).not.toBeInTheDocument();
  });
});
