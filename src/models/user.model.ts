export interface User {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
}
