import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from 'plaid'
import { type AccountsGetResponse } from 'plaid'
import { getAccessTokens } from '~~/server/database/queries/plaid'

const plaidSecret =
  process.env.PLAID_ENVIRONMENT === 'sandbox'
    ? process.env.PLAID_SANDBOX_SECRET
    : process.env.PLAID_ENVIRONMENT === 'development'
      ? process.env.PLAID_DEVELOPMENT_SECRET
      : process.env.PLAID_PRODUCTION_SECRET

const config = new Configuration({
  basePath:
    PlaidEnvironments[
      process.env.PLAID_ENVIRONMENT as keyof typeof PlaidEnvironments
    ],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': plaidSecret!,
    },
  },
})

const plaid = new PlaidApi(config)

// ──────────────────────────────────────────────────────────────────────────────
// 1) LINK TOKEN  ─ create one per end-user session
// ──────────────────────────────────────────────────────────────────────────────
export async function createLinkToken(userId: string, accessToken?: string) {
  try {
    const { data } = await plaid.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Striive',
      products: [Products.Investments, Products.Transactions], // adjust as needed
      country_codes: [
        // North America & Pacific
        CountryCode.Us,
        CountryCode.Ca,
        CountryCode.Gb, // United Kingdom
        // European Economic Area + CH & NO
        CountryCode.De,
        CountryCode.Fr,
        CountryCode.Es,
        CountryCode.It,
        CountryCode.Nl,
        CountryCode.Ie,
        CountryCode.Be,
        CountryCode.Pt,
        CountryCode.Fi,
        CountryCode.Dk,
        CountryCode.Se,
        CountryCode.No,
        CountryCode.Lt,
        CountryCode.Lv,
        CountryCode.Ee,
        CountryCode.Pl,
      ],
      language: 'en',
      ...(accessToken && {
        access_token: accessToken,
        update: { account_selection_enabled: true },
      }),
    })
    return data.link_token
  } catch (error) {
    console.error('Error creating link token:', error.response?.data ?? error)
    throw error
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 2) PUBLIC → ACCESS TOKEN  ─ exchanged immediately after Link onSuccess
// ──────────────────────────────────────────────────────────────────────────────
export async function exchangePublicToken(publicToken: string) {
  const { data } = await plaid.itemPublicTokenExchange({
    public_token: publicToken,
  })

  const { data: it } = await plaid.itemGet({ access_token: data.access_token })

  return {
    accessToken: data.access_token,
    itemId: data.item_id,
    institution: {
      id: it.item.institution_id,
      name: it.item.institution_name,
    },
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 3) DATA HELPERS  ─ accounts + incremental transaction sync
// ──────────────────────────────────────────────────────────────────────────────
export async function getAllAccounts(
  accessTokens: string[],
): Promise<AccountsGetResponse['accounts']> {
  const responses = await Promise.all(
    accessTokens.map((token) => plaid.accountsGet({ access_token: token })),
  )

  return responses.flatMap((res) => res.data.accounts)
}

export async function syncTransactions(
  accessToken: string,
  cursor?: string | null,
) {
  const { data } = await plaid.transactionsSync({
    access_token: accessToken,
    cursor: cursor ?? null,
    count: 500, // tweak
  })
  return data
}

export default plaid
