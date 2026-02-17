const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export function buildGraphUrl(siteId: string, ...segments: string[]): string {
  const path = segments.filter(Boolean).join('/');
  return `${GRAPH_BASE}/sites/${siteId}/${path}`;
}

export function encodeFieldName(name: string): string {
  return name
    .replace(/ /g, '_x0020_')
    .replace(/ü/g, '_x00fc_')
    .replace(/ş/g, '_x015f_')
    .replace(/ı/g, '_x0131_')
    .replace(/ö/g, '_x00f6_')
    .replace(/ç/g, '_x00e7_')
    .replace(/ğ/g, '_x011f_')
    .replace(/Ü/g, '_x00dc_')
    .replace(/Ş/g, '_x015e_')
    .replace(/İ/g, '_x0130_')
    .replace(/Ö/g, '_x00d6_')
    .replace(/Ç/g, '_x00c7_')
    .replace(/Ğ/g, '_x011e_');
}

export function decodeFieldName(encoded: string): string {
  return encoded
    .replace(/_x0020_/g, ' ')
    .replace(/_x00fc_/g, 'ü')
    .replace(/_x015f_/g, 'ş')
    .replace(/_x0131_/g, 'ı')
    .replace(/_x00f6_/g, 'ö')
    .replace(/_x00e7_/g, 'ç')
    .replace(/_x011f_/g, 'ğ')
    .replace(/_x00dc_/g, 'Ü')
    .replace(/_x015e_/g, 'Ş')
    .replace(/_x0130_/g, 'İ')
    .replace(/_x00d6_/g, 'Ö')
    .replace(/_x00c7_/g, 'Ç')
    .replace(/_x011e_/g, 'Ğ');
}

export function buildFilterQuery(contentTypeName?: string, additionalFilter?: string): string {
  const parts: string[] = [];

  if (contentTypeName) {
    parts.push(`fields/ContentType/Name eq '${contentTypeName}'`);
  }

  if (additionalFilter) {
    parts.push(additionalFilter);
  }

  return parts.join(' and ');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateBackoff(attempt: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = delay * 0.1 * Math.random();
  return delay + jitter;
}
