export type Success<T> = {
  ok: true;
  value: T
}

export const sendSuccess = <T>(value: T): Success<T> => {
  return { ok: true, value };
}