

export function parsePortInput(input: string): number[] {
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) throw new RangeError("No ports specified");

  const ports: number[] = [];

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);

      if (isNaN(start) || isNaN(end)) {
        throw new RangeError(`Invalid range: "${part}"`);
      }
      if (start < 1 || start > 65535) {
        throw new RangeError(`Port ${start} is out of range (1–65535)`);
      }
      if (end < 1 || end > 65535) {
        throw new RangeError(`Port ${end} is out of range (1–65535)`);
      }
      if (start > end) {
        throw new RangeError(`Invalid range ${start}-${end}: start must be ≤ end`);
      }
      if (end - start >= 100) {
        throw new RangeError(`Range ${start}-${end} is too large (max 100 ports at once)`);
      }
      for (let p = start; p <= end; p++) {
        ports.push(p);
      }
    } else {
      const port = parseInt(part, 10);
      if (isNaN(port)) {
        throw new RangeError(`"${part}" is not a valid port number`);
      }
      if (port < 1 || port > 65535) {
        throw new RangeError(`Port ${port} is out of range (1–65535)`);
      }
      ports.push(port);
    }
  }


  return [...new Set(ports)];
}
