import jwt from "jsonwebtoken";

export async function verifyAuth0Token(token: string): Promise<any> {

  try {

    const decoded: any = jwt.decode(token);

    if (!decoded) {
      throw new Error("Invalid token");
    }

    return decoded;

  } catch (err) {

    console.error("Auth0 decode failed:", err);
    return null;

  }
}