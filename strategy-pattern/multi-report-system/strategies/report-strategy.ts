export interface ReportStrategy<T> {
  generate(): Promise<T>;
};

