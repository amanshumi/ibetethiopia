const Company = require("../entity/company");

class CompanyService {
    async getCompanyByChatId(chatId) {
        return await Company.findOne({
            where: {
                chat_id: chatId
            }
        })
    }

    async createCompany(data) {
        return await Company.create(data);
    }
}

module.exports = CompanyService;