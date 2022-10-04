const { authEndpoint } = require("../config")
const axios = require('axios')
const httpStatusCodes = require("../utils/httpStatusCodes")

const getAuthToken = async (mm_username, mm_password) => {
    const {client_id, client_secret} = process.env
    const formData = `client_id=${client_id}&client_secret=${client_secret}&grant_type=password&username=${mm_username}&password=${mm_password}&scope=minimax.si`

    try {
        const response = await axios({
            method: 'POST',
            url: authEndpoint,
            data: formData
        })
        if(response.status === httpStatusCodes.OK) {
            return response.data.access_token
        }
    } catch (error) {
        return {
            statusCode: error.response.status,
            error: error.response.data.error_description,
            path: process.env.NODE_ENV == "DEV" ? error.request.path : null
        }
    }
}

module.exports = {getAuthToken}