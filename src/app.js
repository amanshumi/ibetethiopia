const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const Calendar = require("telegram-inline-calendar");
const TenderService = require("./service/tender");
const CompanyService = require("./service/company");
const BOT_API_KEY = "6583487796:AAE894PwHoP6Oc26853iaFv1d2OtRS_6Qug";

const bot = new TelegramBot(BOT_API_KEY,  { polling: {interval: 5000} });
const ADMIN_USER_ID = "5038786699";

const botState = {};
let companyData = {};
let messageIdForQuery = null;

const regions = ['Addis Ababa', 'Afar', 'Amhara', 'Benishangul gumuz', 'Diredawa', 'Gambella', 'Harari', 'Oromia', 'Sidama', 'SNNPR', 'Somali', 'Tigray'];
const categories = ['Accounting, finance and auditing', 'Printing, Advertising and promotion', 'Stationery materials', 'Agriculture and farming', 'Machinery and equipment', 'Architectural', 'Banking equipment and services', 'Building and warehouse', 'Chemicals and reagents', 'Medical equipment maintenance', 'Cleaning and janitorial equipment', 'Road, bridge and home construction', 'Building, warehouse and finishing materials', 'Water pipes, machinery and equipment', 'General consultancy', 'ICT and software', 'Networking', 'Electronics', 'Furniture', 'Installation and maintenance', 'Electro mechanical and electronics', 'Garment and leather', 'Medical equipment and pharmaceutical products', 'Vehicle and machinery', 'Sport materials and equipment’s'];

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    botState[chatId] = {};
    await showMenu(chatId);
});

async function showMenu(chatId) {
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Post Tender', callback_data: "post_tender" }],
                [{ text: 'Add Notification', callback_data: "add_notification" }],
                [{ text: 'Register Company', callback_data: "register_company" }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    };

    await bot.sendMessage(chatId, 'Please select one of the following options to get started:', options);
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const message = msg.text?.toString();

    if (message === "/start") {
        botState[chatId] = {};
        return;
    }

    if (message === "back") {
        showMenu(chatId);
        return;
    }

    if (message === "Post Tender") {
        botState[chatId].action = 'post_tender';
        promptRegion(chatId);
        return;
    }

    if (botState[chatId]?.action === "register_company") {
        handleCompanyRegister(chatId, message, msg.contact, messageId);
        return;
    }

    if (botState[chatId]?.action === 'post_tender') {
        const currentStep = getCurrentStep(chatId);
        switch (currentStep) {
            case 'ownerCompany':
                botState[chatId].ownerCompany = message;
                bot.sendMessage(chatId, 'Please write tender header:');
                break;
            case 'header':
                botState[chatId].header = message;
                bot.sendMessage(chatId, 'Please write tender description:');
                break;
            case 'description':
                botState[chatId].description = message;
                bot.sendMessage(chatId, 'Please write bid starting birr:');
                break;
            case 'startBid':
                if (!isValidAmount(message)) {
                    bot.sendMessage(chatId, 'Please enter a valid amount for bid starting birr.');
                    return;
                }

                botState[chatId].startBid = message;
                bot.sendMessage(chatId, 'Please write bid closing date (YYYY-MM-DD):');
                break;
            case 'closingDate':
                botState[chatId].closingDate = message;
                bot.sendMessage(chatId, 'Please write bid opening date (YYYY-MM-DD):');
                break;
            case 'openingDate':
                botState[chatId].openingDate = message;
                bot.sendMessage(chatId, 'Please write CPO amount:');
                break;
            case 'cpoAmount':
                if (!isValidAmount(message)) {
                    bot.sendMessage(chatId, 'Please enter a valid amount for CPO amount.');
                    return;
                }

                botState[chatId].cpoAmount = message;
                bot.sendMessage(chatId, 'Please write tender footer:');
                break;
            case 'footer':
                botState[chatId].footer = message;
                bot.sendMessage(chatId, 'Please write tender contact info:');
                break;
            case 'contactInfo':
                botState[chatId].contactInfo = message;
                // All steps completed, construct and send tender message
                const tenderMsg = `
                Please confirm the information:
                Tender Region: ${botState[chatId].region}
                Tender Category: ${botState[chatId].category}
                Tender Owner Company: ${botState[chatId].ownerCompany}
                Tender Header: ${botState[chatId].header}
                Tender Description: ${botState[chatId].description}
                Starting Bid: ${botState[chatId].startBid}
                Closing Date: ${botState[chatId].closingDate}
                Opening Date: ${botState[chatId].openingDate}
                CPO Amount: ${botState[chatId].cpoAmount}
                Tender Footer: ${botState[chatId].footer}
                Contact Info: ${botState[chatId].contactInfo}
                `;
                const confirmOptions = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Confirm', callback_data: 'confirm_post' }],
                            [{ text: 'Cancel', callback_data: 'cancel_post' }]
                        ]
                    }
                };
                bot.sendMessage(chatId, tenderMsg, confirmOptions);
                break;
        }
    }
});

function isValidAmount(amount) {
    return /^\d+(\.\d{1,2})?$/.test(amount); // Checks if the amount is a valid number with up to 2 decimal places
}

function requestApproval(message, chatId) {
    botState[chatId] = message;
    bot.sendMessage('5392036089', `New message from ${chatId}:\n\n${message}\n\nApprove or reject?`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Approve', callback_data: 'approve' }],
                [{ text: 'Reject', callback_data: 'reject' }]
            ]
        }
    });
}

function getTenderMessage(chatId) {
    // Construct and return the tender message
    return `
        Tender Region: ${botState[chatId].region}
        Tender Category: ${botState[chatId].category}
        Tender Owner Company: ${botState[chatId].ownerCompany}
        Tender Header: ${botState[chatId].header}
        Tender Description: ${botState[chatId].description}
        Starting Bid: ${botState[chatId].startBid}
        Closing Date: ${botState[chatId].closingDate}
        Opening Date: ${botState[chatId].openingDate}
        CPO Amount: ${botState[chatId].cpoAmount}
        Tender Footer: ${botState[chatId].footer}
        Contact Info: ${botState[chatId].contactInfo}
    `;
}

async function sendTenderMessage(chatId, msg) {
    // Change the channel_id to the actual channel ID
    const channel_id = '@testchannelbottest'; // Update this with your channel ID
    bot.sendMessage(channel_id, msg);
    bot.sendMessage(chatId, "Your post has been approved.").then((responseSend) => {
        console.log("post approved")
        showMenu(chatId);
    }).catch((err) => {
        console.log(err);
    })
}

function promptRegion(chatId) {
    bot.sendMessage(chatId, 'Please select tender region:', {
        reply_markup: {
            inline_keyboard: regions.map(region => [{ text: region, callback_data: region }]),
        }
    });
}

function deletePrompt(chatId, messageId) {
    bot.deleteMessage(chatId, messageId)
        .catch(error => console.log('Error deleting message:', error));
}

function showBackButton(chatId, messageId) {
    bot.editMessageText('Please select one of the following options to get started:', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
            keyboard: [['Back']],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
}

const constructData = (chatId, messageId) => {
    const tenderData = {
        chatId: chatId,
        messageId: messageId,
        region: botState[chatId].region,
        category: botState[chatId].category,
        ownerCompany: botState[chatId].ownerCompany,
        header: botState[chatId].header,
        description: botState[chatId].description,
        startBid: botState[chatId].startBid,
        closingDate: botState[chatId].closingDate,
        openingDate: botState[chatId].openingDate,
        cpoAmount: botState[chatId].cpoAmount,
        footer: botState[chatId].footer,
        contactInfo: botState[chatId].contactInfo
    };

    return tenderData;
}

function removeShareContactButton(chatId, messageId) {
    bot.editMessageReplyMarkup({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
            remove_keyboard: true
        }
    });
}

bot.on("polling_error", console.log);

async function handleCompanyRegister(chatId, message, msg, messageId) {

    if (getCurrentStep(chatId) === "companyName") {
        companyData.company_name = message;
        bot.sendMessage(chatId, 'Share company sector');
    } else if (getCurrentStep(chatId) === "companySector") {
        companyData.company_sector = message;
        bot.sendMessage(chatId, 'Share address');
    } else if (getCurrentStep(chatId) === "address") {
        companyData.address = message;
        bot.sendMessage(chatId, 'Share telegram contact', {
            reply_markup: {
                keyboard: [
                    [{
                        text: 'Share Contact',
                        request_contact: true,
                    }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
        // bot.sendMessage(chatId, 'Share telegram contact');
    } else if (getCurrentStep(chatId) === "telegramContact") {
        companyData.telegram_contact = message;
        bot.sendMessage(chatId, 'Share phone number');
    } else if (getCurrentStep(chatId) === "phoneNumber") {
        companyData.phone_no = message;
        bot.sendMessage(chatId, 'Share your email');
    } else if (getCurrentStep(chatId) === "email") {
        companyData.email = message;
    }

    if (Object.keys(companyData).length === 6) {
        companyData.chat_id = chatId;
        await new CompanyService().createCompany(companyData);
        bot.sendMessage(chatId, 'Company information saved.', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Main menu", callback_data: "main_menu" }]
                ]
            }
        });
        companyData = {}; // Reset companyData for the next company
    }
}

bot.on('contact', async (msg) => {
    console.log(msg);
    const chatId = msg.from.id;
    const contact = JSON.stringify(msg.contact);

    if (botState[chatId]?.action === 'register_company') {
        companyData.telegram_contact = contact;
        // handleCompanyRegister(chatId, contact, null, null);
    }
});

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    if (data === "post_tender") {
        botState[chatId].action = 'post_tender';
        bot.deleteMessage(chatId, messageId);
        promptRegion(chatId);
        bot.answerCallbackQuery(callbackQuery.id);

        return;
    }

    if (data === "main_menu") {
        bot.deleteMessage(chatId, messageId);
        bot.answerCallbackQuery(callbackQuery.id);
        showMenu(chatId);
    }

    if (data === "add_notification") {
        bot.deleteMessage(chatId, messageId);
        // handle add notification for 2 cases
        botState[chatId].action = "add_notification";
        console.log(callbackQuery);
        bot.answerCallbackQuery(callbackQuery.id);
        return;
    }

    if (data === "register_company") {
        botState[chatId] = { action: "register_company" };
        // handle company registration
        // check company existence before registering
        bot.answerCallbackQuery(callbackQuery.id);
        bot.deleteMessage(chatId, messageId);
        const checkCompanyExists = await new CompanyService().getCompanyByChatId(chatId);

        if (checkCompanyExists) {
            await bot.deleteMessage(chatId, messageId)
            await bot.sendMessage(chatId, "Your company already exists.", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Main menu", callback_data: "main_menu" }]
                    ]
                }
            });

            return;
        }

        bot.sendMessage(chatId, "Share company name")
        return;
    }

    if (data === "confirm_post") {
        bot.answerCallbackQuery(callbackQuery.id);
        // construct tender and save to db
        messageIdForQuery = messageId;
        const tenderData = constructData(chatId, messageId);
        const savedTender = await new TenderService().addTender(tenderData);

        deletePrompt(chatId, callbackQuery.message.message_id);
        requestApproval(getTenderMessage(chatId), chatId);
        bot.sendMessage(chatId, "Your post has been submitted and waiting for approval")
        return;
    }

    if (data === "approve") {
        bot.answerCallbackQuery(callbackQuery.id);
        // get the tender data by message ID from db and post it to the channel
        const tenderData = await new TenderService().getTenderByMessageId(messageIdForQuery);

        if (!tenderData.dataValues) {
            bot.sendMessage(chatId, "Something went wrong");
        }

        const tenderMsg = `
    **Tender Notification**
    Region: ${tenderData.dataValues?.region}
    Category: ${tenderData.dataValues?.category}
    Owner Company: ${tenderData.dataValues?.ownerCompany}
    Header: ${tenderData.dataValues?.header}
    Description: ${tenderData.dataValues?.description}
    Starting Bid: ${tenderData.dataValues?.startBid}
    Closing Date: ${tenderData.dataValues?.closingDate}
    Opening Date: ${tenderData.dataValues?.openingDate}
    CPO Amount: ${tenderData.dataValues?.cpoAmount}
    Footer: ${tenderData.dataValues?.footer}
    Contact Info: ${tenderData.dataValues?.contactInfo}
    `;
        await sendTenderMessage(chatId, tenderMsg);
        deletePrompt(chatId, callbackQuery.message.message_id);
        return;
    }

    if (data === "reject") {
        bot.answerCallbackQuery(callbackQuery.id);
        deletePrompt(chatId, callbackQuery.message.message_id);
        bot.sendMessage(chatId, "Your post has been rejected");
        return;
    }

    if (botState[chatId].action === 'post_tender') {
        switch (getCurrentStep(chatId)) {
            case 'region':
                botState[chatId].region = data;
                deletePrompt(chatId, callbackQuery.message.message_id);
                promptCategory(chatId);
                bot.answerCallbackQuery(callbackQuery.id);
                break;
            case 'category':
                botState[chatId].category = data;
                deletePrompt(chatId, callbackQuery.message.message_id);
                bot.answerCallbackQuery(callbackQuery.id);
                promptOwnerCompany(chatId);
                break;
            case 'ownerCompany':
                botState[chatId].ownerCompany = data;
                promptTenderHeader(chatId);
                break;
            case 'header':
                botState[chatId].header = data;
                promptTenderDescription(chatId);
                break;
            case 'description':
                botState[chatId].description = data;
                promptBidStartingBirr(chatId);
                break;
            case 'startBid':
                botState[chatId].startBid = data;
                promptBidClosingDate(chatId);
                break;
            case 'closingDate':
                botState[chatId].closingDate = data;
                promptBidOpeningDate(chatId);
                break;
            case 'openingDate':
                botState[chatId].openingDate = data;
                promptCPOAmount(chatId);
                break;
            case 'cpoAmount':
                botState[chatId].cpoAmount = data;
                promptTenderFooter(chatId);
                break;
            case 'footer':
                botState[chatId].footer = data;
                promptTenderContactInfo(chatId);
                break;
            case 'contactInfo':
                botState[chatId].contactInfo = data;
                // All steps completed, construct and send tender message
                // sendTenderMessage(chatId);
                break;
        }
    }
});

function promptCategory(chatId) {
    bot.sendMessage(chatId, 'Please select tender category:', {
        reply_markup: {
            inline_keyboard: categories.map(category => [{ text: category, callback_data: category }])
        }
    });
}

function promptOwnerCompany(chatId) {
    bot.sendMessage(chatId, 'Please write tender owner company:');
}

function promptTenderHeader(chatId) {
    bot.sendMessage(chatId, 'Please write tender header:');
}

function promptTenderDescription(chatId) {
    bot.sendMessage(chatId, 'Please write tender description:');
}

function promptBidStartingBirr(chatId) {
    bot.sendMessage(chatId, 'Please write bid starting birr:');
}

function promptBidClosingDate(chatId) {
    bot.sendMessage(chatId, 'Please write bid closing date (YYYY-MM-DD):');
}

function promptBidOpeningDate(chatId) {
    bot.sendMessage(chatId, 'Please write bid opening date (YYYY-MM-DD):');
}

function promptCPOAmount(chatId) {
    bot.sendMessage(chatId, 'Please write CPO amount:');
}

function promptTenderFooter(chatId) {
    bot.sendMessage(chatId, 'Please write tender footer:');
}

function promptTenderContactInfo(chatId) {
    bot.sendMessage(chatId, 'Please write tender contact info:');
}

// function sendTenderMessage(chatId) {
//     const tenderMsg = `
//     Tender Region: ${botState[chatId].region}
//     Tender Category: ${botState[chatId].category}
//     Tender Owner Company: ${botState[chatId].ownerCompany}
//     Tender Header: ${botState[chatId].header}
//     Tender Description: ${botState[chatId].description}
//     Starting Bid: ${botState[chatId].startBid}
//     Closing Date: ${botState[chatId].closingDate}
//     Opening Date: ${botState[chatId].openingDate}
//     CPO Amount: ${botState[chatId].cpoAmount}
//     Tender Footer: ${botState[chatId].footer}
//     Contact Info: ${botState[chatId].contactInfo}
//     `;
//     bot.sendMessage(chatId, tenderMsg);
// }

function getCurrentStep(chatId) {
    const state = botState[chatId];
    if (!state) return 'start';
    if (!state.action) return 'action';
    if (state.action === 'post_tender') {
        if (!state.region) return 'region';
        if (!state.category) return 'category';
        if (!state.ownerCompany) return 'ownerCompany';
        if (!state.header) return 'header';
        if (!state.description) return 'description';
        if (!state.startBid) return 'startBid';
        if (!state.closingDate) return 'closingDate';
        if (!state.openingDate) return 'openingDate';
        if (!state.cpoAmount) return 'cpoAmount';
        if (!state.footer) return 'footer';
        if (!state.contactInfo) return 'contactInfo';
    }

    if (state.action === "register_company") {
        if (!companyData.company_name) return 'companyName';
        if (!companyData.company_sector) return 'companySector';
        if (!companyData.address) return 'address';
        if (!companyData.telegram_contact) return 'telegramContact';
        if (!companyData.phone_no) return 'phoneNumber';
        if (!companyData.email) return 'email';
    }
}

const app = express();
app.use(express.json());

app.listen(9090, () => {
    console.log("Listening on port 9090");
});
