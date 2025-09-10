import { z } from 'zod';

export const scanProductSchema = z.object({
  body: z.object({
    barcode: z.string().optional(),
    productName: z.string().optional(),
    imageUrl: z.string().url().optional()
  }).refine(data => data.barcode || data.productName || data.imageUrl, {
    message: 'Either barcode, productName, or imageUrl is required'
  })
});

export const getProductSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product ID is required')
  })
});

export const getHistorySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    sortBy: z.enum(['scannedAt', 'healthScore', 'productName']).optional().default('scannedAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
  })
});

export const deleteHistorySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Record ID is required')
  })
});

