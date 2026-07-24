export const env = {
  apiId: Number(process.env.API_ID),
  apiHash: process.env.API_HASH ?? '',
  port: Number(process.env.PORT) || 3001
}
