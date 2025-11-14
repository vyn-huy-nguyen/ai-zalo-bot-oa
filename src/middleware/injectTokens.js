/**
 * Middleware to inject Zalo tokens into request object
 * @param {string} refreshToken - Zalo refresh token
 * @param {string} fallbackToken - Zalo access token fallback
 * @param {string} webhookSecret - Webhook secret
 * @param {string} verifyToken - Webhook verify token
 * @returns {Function} Express middleware
 */
export function injectTokens(refreshToken, fallbackToken, webhookSecret, verifyToken) {
  return (req, res, next) => {
    req.refreshToken = refreshToken;
    req.fallbackToken = fallbackToken;
    req.webhookSecret = webhookSecret;
    req.verifyToken = verifyToken;
    next();
  };
}

