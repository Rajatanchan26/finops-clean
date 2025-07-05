function requireAdmin(req, res, next) {
  console.log('requireAdmin check:', { 
    hasUser: !!req.user, 
    isAdmin: req.user?.is_admin,
    userId: req.user?.id,
    userEmail: req.user?.email 
  });
  
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ message: 'Admins only' });
  }
  next();
}

function requireGrade(minGrade) {
  return (req, res, next) => {
    if (!req.user || req.user.is_admin || (req.user.grade || 0) < minGrade) {
      return res.status(403).json({ message: `Grade ${minGrade}+ users only` });
    }
    next();
  };
}

function blockAdmins(req, res, next) {
  if (req.user && req.user.is_admin) {
    return res.status(403).json({ message: 'Admins cannot access this resource' });
  }
  next();
}

module.exports = { requireAdmin, requireGrade, blockAdmins }; 