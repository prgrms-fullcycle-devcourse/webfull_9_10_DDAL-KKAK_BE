export type SuccessResponse<T> = {
  success: true;
  status: number;
  message: string;
  data: T;
  timestamp: string;
};

export type ErrorResponse = {
  success: false;
  status: number;
  message: string;
  error?: {
    code: string;
    detail?: string;
  };
  timestamp: string;
};
