const jwt = require('jsonwebtoken')
const httpStatusCodes = require('../utils/httpStatusCodes')
const {getAuthToken} = require('../api/authApi')

const protect = async(req, res, next) => {
    let token

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header ('Bearer <token>')
            token = req.headers.authorization.split(' ')[1]

            // Verify token
            jwt.verify(token, process.env.JWT_SECRET, async function(err, decoded) {
                if (err) {
                    return res.status(httpStatusCodes.BAD_REQUEST).json({
                        statusCode: httpStatusCodes.BAD_REQUEST,
                        error: `${err.name}: ${err.message}`
                    })
                }
                const {mm_username, mm_password} = decoded
                if(!mm_username || !mm_password) {
                    return res.status(httpStatusCodes.BAD_REQUEST).json({
                        statusCode: httpStatusCodes.BAD_REQUEST,
                        error: `Invalid bearer token format.`
                    })
                }

                const authToken = await getAuthToken(mm_username, mm_password)
                if(authToken.statusCode) {
                    return res.status(authToken.statusCode).json({
                        statusCode: authToken.statusCode,
                        error: `Authorization failed.`
                    })
                }
                req.authToken = authToken
                next()
            })
        }
        catch(error) {
            console.log(error)
            return res.status(httpStatusCodes.UNAUTHORIZED).json({
                statusCode: httpStatusCodes.UNAUTHORIZED,
                error: `Authorization failed.`
            })
        }
    }

    if(!token) {
        return res.status(httpStatusCodes.BAD_REQUEST).json({
            statusCode: httpStatusCodes.BAD_REQUEST,
            error: `No bearer token provided.`
        })
    }
}

module.exports = {protect}