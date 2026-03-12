import { cn } from "@/lib/utils";

describe("cn()", () => {
    it("returns a single class string unchanged", () => {
        expect(cn("foo")).toBe("foo");
    });

    it("merges multiple class strings", () => {
        expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("deduplicates conflicting Tailwind classes (last wins)", () => {
        expect(cn("p-4", "p-8")).toBe("p-8");
    });

    it("handles conditional classes via objects", () => {
        expect(cn("base", { active: true, hidden: false })).toBe("base active");
    });

    it("handles arrays", () => {
        expect(cn(["a", "b"], "c")).toBe("a b c");
    });

    it("ignores falsy values", () => {
        expect(cn("a", undefined, null, false, "b")).toBe("a b");
    });

    it("returns empty string when no args", () => {
        expect(cn()).toBe("");
    });

    it("merges Tailwind color classes correctly", () => {
        expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });
});
