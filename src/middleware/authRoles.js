export const authorizeRoles = (...allowedRoles) => {
    return (req,res,next) => {
        if(!req.user || !req.user.role){
            return res.status(401).json({message: "Missing User Credentials!"})
        }

        if(!allowedRoles.includes(req.user.role)){
            return res.status(403).json({message: "Frobidden. You don't have perform this action"})
        }
        next()
    }
}