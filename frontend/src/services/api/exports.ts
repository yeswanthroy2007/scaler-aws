export type ExportFormat = "json" | "bind";

export function getExportUrl(zoneId: number, format: ExportFormat): string {
  return `/api/hosted-zones/${zoneId}/export?format=${format}`;
}

export function triggerExportDownload(zoneId: number, format: ExportFormat): void {
  const url = getExportUrl(zoneId, format);
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
