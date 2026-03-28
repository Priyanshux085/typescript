type Brand<T, B> = T & { readonly __brand: B };

export type TenantId = Brand<string, "TenantId">;

export type WalletId = Brand<string, "WalletId">;

export type TransactionId = Brand<string, "TransactionId">;

export const createTenantId = (id: string): TenantId => {
	return id as TenantId;
};

export const createWalletId = (id: string): WalletId => {
	return id as WalletId;
};

export const createTransactionId = (id: string): TransactionId => {
	return id as TransactionId;
};
