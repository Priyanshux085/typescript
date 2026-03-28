# Assignment: Rolar Wallet SaaS (OOP + Strategy Pattern)

## Overview
Design a scalable, multi-tenant wallet service for businesses. The product supports creating wallets, posting transactions, enforcing limits, calculating fees, and routing payouts. You will focus on an OOP domain schema, clean module boundaries, and pluggable strategies.

## Goals
- Model a wallet domain with clear aggregates, invariants, and value objects.
- Use the strategy pattern to make fee calculation and routing configurable per tenant plan.
- Keep modules independent and scalable using a module-first structure.
- Apply advanced TypeScript typing (branded IDs, discriminated unions, type guards).

## Target File Structure (module-first)
Use this as the primary structure. You can rename files, but keep the module and layer boundaries.

```
src/rolar/
  doc.md
  que.md
  modules/
    tenant/
      domain/
        Tenant.ts
        TenantId.ts
        TenantPlan.ts
      application/
        CreateTenant.ts
        UpdateTenantPlan.ts
      infrastructure/
        TenantRepository.ts
    user-access/
      domain/
        User.ts
        Role.ts
        Permission.ts
      application/
        AssignRole.ts
    wallet/
      domain/
        Wallet.ts
        WalletId.ts
        Balance.ts
        LedgerEntry.ts
        WalletPolicy.ts
        strategies/
          FeeStrategy.ts
          FlatFeeStrategy.ts
          TieredFeeStrategy.ts
          RoutingStrategy.ts
          BankRoutingStrategy.ts
          CardRoutingStrategy.ts
      application/
        OpenWallet.ts
        PostTransaction.ts
        TransferFunds.ts
        Payout.ts
      infrastructure/
        WalletRepository.ts
        LedgerRepository.ts
    pricing/
      domain/
        PricingPlan.ts
        FeeRule.ts
      application/
        ResolveFeeStrategy.ts
    risk/
      domain/
        LimitPolicy.ts
        RiskSignal.ts
      application/
        EvaluateLimits.ts
    audit/
      domain/
        AuditEvent.ts
      application/
        RecordAuditEvent.ts
  shared/
    domain/
      Money.ts
      Currency.ts
      Result.ts
      DomainError.ts
      Id.ts
    types/
      Branded.ts
  app/
    http/
      WalletController.ts
      TenantController.ts
    config/
      appConfig.ts
  tests/
    wallet/
      fee-strategy.spec.ts
```

### Layering Rules
- `domain` has no dependency on `application` or `infrastructure`.
- `application` depends on `domain` and exposes use cases.
- `infrastructure` implements repositories and external adapters.
- `app/http` adapts transport to application services.

## Domain Model Requirements (OOP schema)
Model these core concepts with classes and value objects:
- **Tenant**: owns wallet configurations and pricing plans.
- **Wallet**: balance, status, currency, and policy rules.
- **LedgerEntry**: double-entry or single-entry with immutable records.
- **Transaction**: status transitions with invariants and idempotency key.
- **PricingPlan**: ties tenants to fee policies and strategies.
- **Money/Currency**: value objects with safe arithmetic and formatting.
- **AuditEvent**: immutable event records with metadata.

### Required Invariants
- Wallet balance cannot go negative unless policy allows overdraft.
- Each transaction produces consistent ledger entries.
- Transaction state changes are controlled and validated.
- Fees must be deterministic for the same input.

## Strategy Pattern Focus
You must implement strategy interfaces and at least two concrete strategies in each category:

1. **FeeStrategy**
   - `FlatFeeStrategy`, `TieredFeeStrategy`.
   - Input: `Money`, `TenantPlan`, `TransactionType`.
   - Output: `Money` fee.

2. **RoutingStrategy**
   - `BankRoutingStrategy`, `CardRoutingStrategy`.
   - Input: `PayoutRequest`, `TenantPlan`.
   - Output: `RoutingDecision` with provider and SLA.

3. **LimitStrategy** (optional but recommended)
   - `KycLimitStrategy`, `HighRiskLimitStrategy`.
   - Input: `Wallet`, `RiskSignal`.
   - Output: `LimitDecision`.

Strategy selection should be done via a resolver in the `pricing` or `risk` module. Avoid large `switch` blocks inside the domain entities.

## Advanced TypeScript Requirements
Use at least three of the following:
- Branded IDs (`TenantId`, `WalletId`, `TransactionId`).
- Discriminated unions for transaction states.
- Type guards for safe casting of external inputs.
- Readonly value objects for immutability.
- Utility types for DTO transformations.

## Required Flows (application layer)
- Create a tenant and assign a pricing plan.
- Open a wallet and seed balance.
- Post a transaction and emit ledger entries.
- Transfer funds between wallets.
- Payout funds using routing strategy.
- Record an audit event for each state change.

## Non-Functional Expectations
- Multi-tenant isolation (no cross-tenant data access).
- Idempotency for transaction posting.
- Deterministic fee results.
- Extensible strategy registration.
- Clear separation of domain vs infrastructure.

## Deliverables
- OOP schema (classes and interfaces) following the structure above.
- Strategy interfaces and 2+ implementations each (Fee, Routing).
- Application services for the required flows.
- Repository interfaces (no DB implementation needed).
- Unit tests for at least one strategy and one domain invariant.
- Short architecture notes in comments or README-style text.

## Step-by-Step Design Walkthrough (high level)
1. Define bounded contexts (tenant, wallet, pricing, risk, audit).
2. Identify aggregates and invariants per context.
3. Model value objects (Money, IDs) and shared errors.
4. Define strategy interfaces and selection rules.
5. Build application services around use cases.
6. Add repository ports and test the core rules.

## Evaluation Criteria
- Correct use of OOP boundaries and invariants.
- Strategy pattern is clean, extensible, and testable.
- Module structure is consistent and scalable.
- Types are strict and avoid `any`.
- Tests cover the most critical rules.
