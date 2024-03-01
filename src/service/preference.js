const Preference = require("../entity/preference");

class PreferenceService {
    async createPreference(data) {
        const checkIfExists = await Preference.findOne({
            where: {
                chatId: data?.chatId,
                subscriptionType: data?.subscriptionType
            }
        });

        if (checkIfExists?.dataValues) {
            return await Preference.update({
                subscriptionType: data?.subscriptionType,
                subscriptionValue: data?.subscriptionValue
            }, {
                where: {
                    chatId: data?.chatId,
                    subscriptionType: data?.subscriptionType
                }
            })
        } else { return await Preference.create(data); }
    }

    async getPreferenceByChatId(chatId) {
        return await Preference.findAll({
            where: {
                chatId: chatId
            }
        })
    }
}

module.exports = PreferenceService;