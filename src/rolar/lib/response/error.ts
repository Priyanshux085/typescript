import type { DomainError } from "../../shared/domain/DomainError";

export type Failure = {
	ok: false;
	error: DomainError;
};
