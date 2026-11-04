export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    /** Stable machine-readable reason the client can act on, e.g. SIGN_IN_REQUIRED. */
    public code?: string
  ) {
    super(message);
  }
}

export const signInRequired = (message: string) => new ApiError(403, message, "SIGN_IN_REQUIRED");
