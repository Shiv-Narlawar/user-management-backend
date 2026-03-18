import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

// env
const domain = process.env.AUTH0_DOMAIN!;
const audience = process.env.AUTH0_AUDIENCE!;

// client
const client = jwksClient({
  jwksUri: `https://${domain}/.well-known/jwks.json`,
});

// key
function getKey(header: JwtHeader, callback: SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error("Missing kid"), undefined);
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err, undefined);

    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// verify
export function verifyAuth0Token(token: string): Promise<jwt.JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience,
        issuer: `https://${domain}/`,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err || !decoded) {
          console.error("auth0 verify error:", err);
          return reject(err);
        }

        resolve(decoded as jwt.JwtPayload);
      }
    );
  });
}