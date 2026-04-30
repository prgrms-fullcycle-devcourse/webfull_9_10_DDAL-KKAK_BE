export type SuccessResponse<tData> = {
  success: true;
  status: number;
  message: string;
  data: tData;
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
