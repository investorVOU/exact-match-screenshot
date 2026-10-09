import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VisitorNotice } from "@/components/visitor-notice";

vi.mock("@/lib/pixel", () => ({ trackWhatsAppLead: vi.fn() }));
import { trackWhatsAppLead } from "@/lib/pixel";

describe("visitor notice", () => {
  beforeEach(() => { sessionStorage.clear(); vi.useFakeTimers(); vi.clearAllMocks(); });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it("opens for a new visitor and stays dismissed during their browsing session", () => {
    const first = render(<VisitorNotice />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1200); });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue browsing cars" }));
    first.unmount();
    render(<VisitorNotice />);
    act(() => { vi.advanceTimersByTime(1200); });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sends enquiries to the owner's WhatsApp number and records a lead", () => {
    render(<VisitorNotice />);
    act(() => { vi.advanceTimersByTime(1200); });
    const contact = screen.getByRole("link");
    const url = new URL(contact.getAttribute("href") ?? "");
    expect(url.origin + url.pathname).toBe("https://wa.me/2348149613583");
    expect(url.searchParams.get("text")).toContain("arrange delivery to my location");
    fireEvent.click(contact);
    expect(trackWhatsAppLead).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});