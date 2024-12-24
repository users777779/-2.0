import { Request, Response, NextFunction } from 'express'

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error)
  res.status(500).json({
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  })
}
