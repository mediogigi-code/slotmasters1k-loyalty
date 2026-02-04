import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      discord_username?: string;
    };
  }

  interface User {
    id: string;
    discord_username?: string;
  }
}