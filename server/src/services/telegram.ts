import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { Api } from 'telegram'
import { errors } from 'telegram'
import { env } from '../config/env.js'
import * as sessionStore from './session-store.js'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

type PendingAuth = {
  phone: string
  phoneCodeHash: string
  step: 'code' | 'password'
}

export type AuthUser = {
  id: string
  firstName?: string
  lastName?: string
  username?: string
}

let client: TelegramClient | null = null
let pendingAuth: PendingAuth | null = null

function assertCredentials(): void {
  if (!env.apiId || !env.apiHash) {
    throw new ConfigError('API_ID and API_HASH must be set in server/.env')
  }
}

async function createClient(sessionString = ''): Promise<TelegramClient> {
  assertCredentials()

  const instance = new TelegramClient(
    new StringSession(sessionString),
    env.apiId,
    env.apiHash,
    { connectionRetries: 5 }
  )

  await instance.connect()
  return instance
}

async function resetClient(sessionString = ''): Promise<TelegramClient> {
  if (client) {
    await client.disconnect()
    client = null
  }

  client = await createClient(sessionString)
  return client
}

async function getClient(sessionString = ''): Promise<TelegramClient> {
  if (!client) {
    client = await createClient(sessionString)
    return client
  }

  if (!client.connected) {
    await client.connect()
  }

  return client
}

function mapUser(me: Api.User): AuthUser {
  return {
    id: me.id.toString(),
    firstName: me.firstName,
    lastName: me.lastName,
    username: me.username
  }
}

async function persistSession(activeClient: TelegramClient): Promise<AuthUser> {
  const session = (activeClient.session as StringSession).save()
  await sessionStore.saveSession(session)
  pendingAuth = null

  const me = await activeClient.getMe()
  if (!me) {
    throw new AuthError('Failed to load Telegram user profile')
  }

  return mapUser(me)
}

export async function initTelegramClient(): Promise<void> {
  const session = await sessionStore.loadSession()
  if (!session) return

  const activeClient = await getClient(session)
  if (!(await activeClient.isUserAuthorized())) {
    await sessionStore.clearSession()
    await resetClient()
  }
}

export async function getAuthStatus(): Promise<{
  authenticated: boolean
  user?: AuthUser
}> {
  const session = await sessionStore.loadSession()
  if (!session) {
    return { authenticated: false }
  }

  try {
    const activeClient = await getClient(session)
    if (!(await activeClient.isUserAuthorized())) {
      return { authenticated: false }
    }

    const me = await activeClient.getMe()
    if (!me) {
      return { authenticated: false }
    }

    return { authenticated: true, user: mapUser(me) }
  } catch {
    return { authenticated: false }
  }
}

export async function getAuthenticatedClient(): Promise<TelegramClient> {
  const session = await sessionStore.loadSession()
  if (!session) {
    throw new AuthError('Not authenticated')
  }

  const activeClient = await getClient(session)
  if (!(await activeClient.isUserAuthorized())) {
    throw new AuthError('Not authenticated')
  }

  return activeClient
}

export async function startAuth(phone: string): Promise<{ isCodeViaApp: boolean }> {
  assertCredentials()

  const status = await getAuthStatus()
  if (status.authenticated) {
    throw new AuthError('Already authenticated')
  }

  const activeClient = await resetClient()
  const result = await activeClient.sendCode(
    { apiId: env.apiId, apiHash: env.apiHash },
    phone
  )

  pendingAuth = {
    phone,
    phoneCodeHash: result.phoneCodeHash,
    step: 'code'
  }

  return { isCodeViaApp: result.isCodeViaApp }
}

export async function verifyAuth(input: {
  phone: string
  code?: string
  password?: string
}): Promise<{ user: AuthUser; requiresPassword?: boolean }> {
  assertCredentials()

  const { phone, code, password } = input
  const activeClient = await getClient()

  if (pendingAuth?.step === 'password') {
    if (pendingAuth.phone !== phone) {
      throw new AuthError('Phone number does not match the pending login')
    }

    if (!password) {
      throw new AuthError('Two-factor password is required')
    }

    await activeClient.signInWithPassword(
      { apiId: env.apiId, apiHash: env.apiHash },
      {
        password: async () => password,
        onError: (error) => {
          throw error
        }
      }
    )

    const user = await persistSession(activeClient)
    return { user }
  }

  if (!pendingAuth || pendingAuth.phone !== phone) {
    throw new AuthError('Start login with /api/auth/start before verifying')
  }

  if (!code) {
    throw new AuthError('Verification code is required')
  }

  try {
    await activeClient.invoke(
      new Api.auth.SignIn({
        phoneNumber: phone,
        phoneCodeHash: pendingAuth.phoneCodeHash,
        phoneCode: code
      })
    )
  } catch (error) {
    if (
      error instanceof errors.RPCError &&
      error.errorMessage === 'SESSION_PASSWORD_NEEDED'
    ) {
      pendingAuth = { ...pendingAuth, step: 'password' }
      return { user: { id: '' }, requiresPassword: true }
    }

    const message =
      error instanceof Error ? error.message : 'Failed to verify Telegram code'
    throw new AuthError(message)
  }

  const user = await persistSession(activeClient)
  return { user }
}

export async function logout(): Promise<void> {
  pendingAuth = null
  await sessionStore.clearSession()

  if (client) {
    await client.disconnect()
    client = null
  }
}
