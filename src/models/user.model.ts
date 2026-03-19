export interface User {
  id: string;
  name: string;
  email: string;
  password: string; 
  role: string;
  status: "ACTIVE" | "INACTIVE" | "INVITED";
}
