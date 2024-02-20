const { default: axios } = require("axios");

const BOT_API_KEY = "6583487796:AAE894PwHoP6Oc26853iaFv1d2OtRS_6Qug";
const BASE_URL = `https://api.telegram.org/bot${BOT_API_KEY}`;

function getAxioslnstance() {
    return {
        get(method, params) {
            return axios.get(`/${method}`, {
                baseURL: BASE_URL,
                params
            })
        }, 
        post(method, data)  {
            return axios({
                method: "post",
                baseURL: BASE_URL,
                url: `/${method}`,
                data
            })
        }
    }
}

module.exports = { axiosInstance: getAxiosInstance() };
