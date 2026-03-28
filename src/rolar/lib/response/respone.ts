export { success, failure };

import type { Failure } from ".";

import type { Success } from ".";

export type Result<T> = Success<T> | Failure;

const success = <T>(value: T): Success<T> => ({ ok: true, value });

const failure = (error: Failure["error"]): Failure => ({ ok: false, error });
