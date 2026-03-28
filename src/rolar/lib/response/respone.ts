export type Result<T> = Success<T> | Failure;

import type { Failure, Success } from ".";

export { success, failure };

const success = <T>(value: T): Success<T> => ({ ok: true, value });

const failure = (error: Failure["error"]): Failure => ({ ok: false, error });
