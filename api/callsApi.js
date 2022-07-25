const axios = require('axios')

const apiGet = async (endpoint, authToken) => {
    try {
        const response = await axios({
            method: 'GET',
            url: endpoint,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: null
        })
        return {
            statusCode: response.status, 
            data: response.data
        }
    }
    catch(error) {
        return {
            statusCode: error.response.status,
            error: error.response.data,
            path: process.env.NODE_ENV == "DEV" ? error.request.path : null
        }
    } 
}

const apiPost = async (endpoint, authToken, data) => {
    try {
        let response = await axios({
            method: 'POST',
            url: endpoint,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: data
        })
        response = await axios({
            method: 'GET',
            url: response.headers.location,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: null
        })
        return {
            statusCode: response.status,
            data: response.data
        }
    }
    catch(error) {
        return {
            statusCode: error.response.status,
            error: error.response.data,
            ppath: process.env.NODE_ENV == "DEV" ? error.request.path : null
        }
    }
}

const apiPut = async (endpoint, authToken, data) => {
    try {
        const response = await axios({
            method: 'PUT',
            url: endpoint,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: data
        })
        return {
            statusCode: response.status,
            data: response.data
        }
    }
    catch(error) {
        return {
            statusCode: error.response.status,
            error: error.response.data,
            path: process.env.NODE_ENV == "DEV" ? error.request.path : null
        }
    }
}

module.exports = {
    apiGet,
    apiPost,
    apiPut
}