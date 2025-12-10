/**
 * Wrapper function to handle async errors in Express middleware and route handlers
 * This prevents unhandled promise rejections from crashing the server
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - Express middleware/handler function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
