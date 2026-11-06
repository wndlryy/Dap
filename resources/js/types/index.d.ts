export interface AuthUser {
  name: string
  email: string
  avatar?: string
  role: string | null
}

export interface SharedPageProps {
  auth: {
    user: AuthUser | null
    role: string | null
  }
}