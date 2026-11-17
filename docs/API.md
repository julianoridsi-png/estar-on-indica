# API — ESTAR ON INDICA

A aplicação usa **Server Actions** e **RPCs do Supabase** (Postgres) em vez de uma API REST tradicional. Os endpoints HTTP públicos são apenas os callbacks de autenticação.

## Rotas HTTP

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/auth/callback` | Callback do OAuth/PKCE do Supabase. |
| GET | `/auth/confirm` | Confirmação de e-mail (token). |

## Server Actions (por domínio)

- **Auth** (`src/lib/auth/actions.ts`): `signupAction`, `loginAction`, `logoutAction`, `forgotPasswordAction`, `resetPasswordAction`, `resendConfirmationAction`.
- **Referrals** (`src/lib/referrals/actions.ts`): `createReferralAction`, `updateReferralStatusAction`.
- **Payouts/PIX** (`src/lib/payouts/actions.ts`): `savePixAction`, `removePixAction`.
- **Admin** (`src/lib/admin/actions.ts`): `revealPixAction`, `updateRewardStatusAction`, `updateRewardSettingsAction`, `generatePendingRewardsAction`.

## RPCs do Supabase (chamadas via `supabase.rpc`)

Ver `docs/DATABASE.md` para lista completa e parâmetros. As RPCs retornam `jsonb` e são executadas com `security definer` após checagem de papel.