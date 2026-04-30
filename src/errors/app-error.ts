export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly detail: string;

  public constructor(
    status: number,
    code: string,
    message: string,
    detail?: string,
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.detail = detail ?? message;
  }
}
