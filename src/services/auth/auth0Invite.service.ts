import axios from "axios";

type Auth0InviteParams = {
  email: string;
  name: string;
};

type Auth0UserSummary = {
  user_id: string;
  email: string;
};

export class Auth0InviteService {
  private readonly domain = process.env.AUTH0_DOMAIN;
  private readonly managementClientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID;
  private readonly managementClientSecret =
    process.env.AUTH0_MANAGEMENT_CLIENT_SECRET;
  private readonly inviteClientId = process.env.AUTH0_INVITE_CLIENT_ID;
  private readonly databaseConnection = process.env.AUTH0_DB_CONNECTION;
  private readonly inviteRedirectUrl = process.env.AUTH0_INVITE_REDIRECT_URL;

  private assertConfig() {
    const missing = [
      ["AUTH0_DOMAIN", this.domain],
      ["AUTH0_MANAGEMENT_CLIENT_ID", this.managementClientId],
      ["AUTH0_MANAGEMENT_CLIENT_SECRET", this.managementClientSecret],
      ["AUTH0_INVITE_CLIENT_ID", this.inviteClientId],
      ["AUTH0_DB_CONNECTION", this.databaseConnection],
    ]
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(
        `Missing Auth0 invite configuration: ${missing.join(", ")}`
      );
    }
  }

  private get baseUrl() {
    return `https://${this.domain}`;
  }

  private async getManagementToken() {
    this.assertConfig();

    const response = await axios.post<{
      access_token: string;
    }>(`${this.baseUrl}/oauth/token`, {
      client_id: this.managementClientId,
      client_secret: this.managementClientSecret,
      audience: `${this.baseUrl}/api/v2/`,
      grant_type: "client_credentials",
    });

    return response.data.access_token;
  }

  private generateTemporaryPassword() {
    return `Tmp!${Math.random().toString(36).slice(2)}${Date.now()}`;
  }

  async findUserByEmail(email: string) {
    const token = await this.getManagementToken();

    const response = await axios.get<Auth0UserSummary[]>(
      `${this.baseUrl}/api/v2/users-by-email`,
      {
        params: { email },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data[0] ?? null;
  }

  async createOrGetDatabaseUser(params: Auth0InviteParams) {
    const existing = await this.findUserByEmail(params.email);

    if (existing) {
      return existing;
    }

    const token = await this.getManagementToken();

    const response = await axios.post<Auth0UserSummary>(
      `${this.baseUrl}/api/v2/users`,
      {
        connection: this.databaseConnection,
        email: params.email,
        name: params.name,
        password: this.generateTemporaryPassword(),
        email_verified: false,
        verify_email: false,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  }

  async sendInviteEmail(email: string) {
    this.assertConfig();

    const payload: Record<string, string> = {
      client_id: this.inviteClientId!,
      email,
      connection: this.databaseConnection!,
    };

    if (this.inviteRedirectUrl) {
      payload.result_url = this.inviteRedirectUrl;
    }

    await axios.post(`${this.baseUrl}/dbconnections/change_password`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
