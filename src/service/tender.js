const Tender = require("../entity/tender");


class TenderService{
    async getTenderByMessageId(msgId) {
        return await Tender.findOne({
            where: {
                messageId: msgId
            }
        })
    }

    async getTenderById(id) {
        return await Tender.findOne({
            where: {
                id: id
            }
        })
    }

    async addTender(data) {
        return await Tender.create(data);
    }

    async deleteTender(id) {
        return await Tender.destroy({
            where: {
                messageId: id
            }
        })
    }
}

module.exports = TenderService;