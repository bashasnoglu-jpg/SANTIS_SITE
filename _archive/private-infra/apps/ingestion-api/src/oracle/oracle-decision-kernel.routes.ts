import express, { Router } from 'express';
import { z } from 'zod';
import { sinkToBigQuery } from '../services/bigquery-sink';

export const oracleDecisionKernelRouter: Router = express.Router();

// Karar şeması
const DecisionSchema = z.object({
  planId: z.string(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  timestamp: z.number().optional()
});

oracleDecisionKernelRouter.post('/execute', async (req, res) => {
  try {
    // 1. Veri doğrulaması
    const validatedData = DecisionSchema.parse(req.body);
    
    // 2. Yanıtı hemen dön (UI akıcılığı için)
    res.status(202).json({ status: 'PROCESSED', planId: validatedData.planId });

    // 3. Arka planda loglama (Non-blocking)
    console.log(`[KERNEL] Decision Recorded: ${validatedData.planId} -> ${validatedData.decision}`);
    
    // BigQuery'ye Asenkron Gönderim
    await sinkToBigQuery({
      planId: validatedData.planId,
      decision: validatedData.decision,
      timestamp: validatedData.timestamp
    });
    
  } catch (error) {
    console.error(`[KERNEL ERROR] Invalid decision format:`, error);
    res.status(400).json({ error: 'Invalid decision format' });
  }
});
