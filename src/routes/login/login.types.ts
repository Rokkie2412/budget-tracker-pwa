export type ErrorCallAPiType = {
  message: string
}

export type LoginRes = {
  message: string,
  credential: import('@/lib/services/auth.types').AuthCredential,
}