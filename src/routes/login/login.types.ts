export type ErrorCallAPiType = {
  message: string
}

export type LoginRes = {
  message: string,
  token: string,
  user: {
    userId: string
  }
}