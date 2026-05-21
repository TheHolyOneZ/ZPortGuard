export const defaultAccent = "#7C3AED";

export function applyAccentColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  document.documentElement.style.setProperty("--accent-hex", hex);
  document.documentElement.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
}
