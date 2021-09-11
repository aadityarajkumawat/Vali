export enum BinaryStatus {
    Success = 1,
    Failure = 0,
}

export interface User {
    userId: string
    name: string
    OTP: string
    email: string
}

export interface UserResponse {
    user: User | null
    found: boolean
    error: null | string
}
