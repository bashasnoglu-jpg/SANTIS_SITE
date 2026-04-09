import { Response } from "express";

export interface HttpResponse {
  success: boolean;
  traceId: string;
  data?: any;
  error?: any;
}

export const sendAck = (res: Response, traceId: string, data: any, statusCode: number = 202) => {
  // 202 Accepted: CQRS mimarisinde Command "kabul edildi ve işleme alındı" demektir.
  return res.status(statusCode).json({
    success: true,
    traceId,
    data
  } as HttpResponse);
};

export const sendNack = (res: Response, traceId: string, error: any, statusCode: number = 400) => {
  return res.status(statusCode).json({
    success: false,
    traceId,
    error
  } as HttpResponse);
};
