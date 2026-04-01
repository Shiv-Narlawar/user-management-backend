import * as crypto from "crypto";

type CreateAuth0UserInput = {
  email: string;
  name: string;
};

type Auth0User = {
  user_id: string;
  email: string;
  name?: string;
};

export class Auth0ManagementService {
  private domain = process.env.AUTH0_DOMAIN;
  private clientId = process.env.AUTH0_M2M_CLIENT_ID;
  private clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET;
  private audience = process.env.AUTH0_MANAGEMENT_AUDIENCE;
  private connection = process.env.AUTH0_DB_CONNECTION;
  private appClientId = process.env.AUTH0_APP_CLIENT_ID;
  private appLoginUrl = process.env.APP_LOGIN_URL;

  private ensureConfig() {
    if (
      !this.domain ||
      !this.clientId ||
      !this.clientSecret ||
      !this.audience ||
      !this.connection
    ) {
      throw new Error("Auth0 management configuration is missing");
    }
  }

  private ensureAppClientId() {
    if (!this.appClientId) {
      throw new Error("Auth0 app client id is missing");
    }
  }

  private async getManagementToken(): Promise<string> {
    this.ensureConfig();

    const response = await fetch(`https://${this.domain}/oauth/token`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: this.audience,
        grant_type: "client_credentials",
      }),
    });

    const data = (await response.json()) as {
      access_token?: string;
      message?: string;
      error?: string;
    };

    if (!response.ok || !data.access_token) {
      throw new Error(data.message || data.error || "Failed to get Auth0 token");
    }

    return data.access_token;
  }

  private generateTemporaryPassword() {
    // Auth0 requires a password when creating a database-connection user.
    return `Tmp#${crypto.randomBytes(12).toString("base64url")}9a`;
  }

  async createUser(data: CreateAuth0UserInput): Promise<Auth0User> {
    const token = await this.getManagementToken();

    const response = await fetch(`https://${this.domain}/api/v2/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        connection: this.connection,
        email: data.email,
        name: data.name,
        password: this.generateTemporaryPassword(),
        email_verified: false,
        verify_email: true,
      }),
    });

    const responseData = (await response.json()) as Auth0User & {
      message?: string;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(
        `Auth0 user creation failed: ${
          responseData.message || responseData.error || "Request failed"
        }`
      );
    }

    return responseData;
  }

  async deleteUser(userId: string) {
    try {
      const token = await this.getManagementToken();

      await fetch(
        `https://${this.domain}/api/v2/users/${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Auth0 rollback delete failed:", error);
    }
  }

  async sendPasswordSetupEmail(email: string): Promise<void> {
    this.ensureConfig();
    this.ensureAppClientId();

    const response = await fetch(
      `https://${this.domain}/dbconnections/change_password`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          client_id: this.appClientId,
          email,
          connection: this.connection,
        }),
      }
    );

    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        `Auth0 password setup email failed: ${message || "Request failed"}`
      );
    }
  }

  getAppLoginUrl() {
    return this.appLoginUrl ?? null;
  }
}
