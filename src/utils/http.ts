export type ApiResponse<T> = {
  data: T;
};

export function ok<T>(data: T): ApiResponse<T> {
  return { data };
}

export function parseBoolean(value?: string) {
  if (!value) return false;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}
