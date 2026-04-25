import type { Distro } from "../types";
import { buildDistroUrl } from "./tagBuilder";

const escapeCsv = (value: string): string => {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const buildCsv = (distros: Distro[]): string => {
  const header = "Name,Url";
  const rows = distros.map(
    (d) => `${escapeCsv(d.name)},${escapeCsv(buildDistroUrl(d))}`,
  );
  return [header, ...rows].join("\n");
};

export const downloadCsv = (distros: Distro[], filename = "distros.csv") => {
  const csv = buildCsv(distros);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
