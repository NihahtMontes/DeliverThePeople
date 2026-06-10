function roleGuard(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (roles.length === 0) {
      return next();
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: `Requiere uno de los roles: ${roles.join(', ')}` });
    }

    next();
  };
}

module.exports = { roleGuard };
