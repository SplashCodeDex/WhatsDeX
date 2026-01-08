import logger from '../utils/logger';

export const errorHandler = (error, req, res, next) => {
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

export const notFoundHandler = (req, res) => { // Removed next parameter
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path
    });
};
