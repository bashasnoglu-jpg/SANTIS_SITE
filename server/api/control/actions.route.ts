import type { Request, Response } from 'express';

export async function getControlActions(_req: Request, res: Response) {
  return res.status(200).json({
    ok: true,
    items: [],
  });
}
