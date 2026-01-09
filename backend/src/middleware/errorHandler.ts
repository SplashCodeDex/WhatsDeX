import logger from '../utils/logger.js';

export const errorHandler = (error: any, req: any, res: any, next: any) => {
    logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
    });

    res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
};

export const notFoundHandler = (req: any, res: any) => { // Removed next parameter
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path
    });
};
