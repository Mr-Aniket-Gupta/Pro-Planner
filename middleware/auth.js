module.exports.ensureAuthenticated = function (req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  // अगर आप JWT यूज़ करते हैं तो यहां JWT चेक करें
  return res.status(401).json({ error: 'Unauthorized' });
}; 