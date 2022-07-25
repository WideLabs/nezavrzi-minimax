const localization = "si"
const baseUrl = `https://moj.minimax.${localization}/${localization}`
const authEndpoint = baseUrl + "/aut/oauth20/token"
const apiBaseUrl = baseUrl + "/api"

module.exports = {authEndpoint, apiBaseUrl}