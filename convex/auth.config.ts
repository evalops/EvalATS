// Validate required environment variables
const clerkJwtIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN
if (!clerkJwtIssuerDomain) {
  throw new Error('CLERK_JWT_ISSUER_DOMAIN environment variable is required')
}

export default {
  providers: [
    {
      domain: clerkJwtIssuerDomain,
      applicationID: "convex",
    },
  ],
}