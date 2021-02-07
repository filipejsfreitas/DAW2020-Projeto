export interface JwtPayload {
  uid: string,
  email: string,
  role: string
  iat: number,
  exp: number,
  jti: number,
}
