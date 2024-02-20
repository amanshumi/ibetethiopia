const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const Calendar = require("telegram-inline-calendar");
const BOT_API_KEY = "6583487796:AAE894PwHoP6Oc26853iaFv1d2OtRS_6Qug";

const bot = new TelegramBot(BOT_API_KEY, { polling: true });

const botState = {};

const regions = ['Addis Ababa', 'Afar', 'Amhara', 'Benishangul gumuz', 'Diredawa', 'Gambella', 'Harari', 'Oromia', 'Sidama', 'SNNPR', 'Somali', 'Tigray'];
const categories = ['Accounting, finance and auditing', 'Printing, Advertising and promotion', 'Stationery materials', 'Agriculture and farming', 'Machinery and equipment', 'Architectural', 'Banking equipment and services', 'Building and warehouse', 'Chemicals and reagents', 'Medical equipment maintenance', 'Cleaning and janitorial equipment', 'Road, bridge and home construction', 'Building, warehouse and finishing materials', 'Water pipes, machinery and equipment', 'General consultancy', 'ICT and software', 'Networking', 'Electronics', 'Furniture', 'Installation and maintenance', 'Electro mechanical and electronics', 'Garment and leather', 'Medical equipment and pharmaceutical products', 'Vehicle and machinery', 'Sport materials and equipment’s'];

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    botState[chatId] = {};
    showMenu(chatId);
});

function showMenu(chatId) {
    const options = {
        reply_markup: {
            keyboard: [
                [{ text: 'Post Tender' }],
                [{ text: 'Add Notification' }],
                [{ text: 'Register Company' }]
            ],
            resize_keyboard: true,
        }
    };

    bot.sendMessage(chatId, 'Please select one of the following options to get started:', options);
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const message = msg.text.toString();

    if (message === "/start") {
        botState[chatId] = {}; // Reset bot state
        // showMenu(chatId);
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

    // if (botState[chatId].action) {
    //     showBackButton(chatId, msg.message_id);
    //     return;
    // }

    if (botState[chatId].action === 'post_tender') {
        const currentStep = getCurrentStep(chatId);
        switch (currentStep) {
            // case 'region':
            //     botState[chatId].region = message;
            //     bot.sendMessage(chatId, 'Please select tender category:', {
            //         reply_markup: {
            //             inline_keyboard: categories.map(category => [{ text: category, callback_data: category }])
            //         }
            //     });
            //     break;
            // case 'category':
            //     botState[chatId].category = message;
            //     bot.sendMessage(chatId, 'Please write tender owner company:');
            //     break;
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
    bot.sendMessage(chatId, "Your post has been sent and waiting for approval.").then((responseSend) => {
        console.log("nicceeee")
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
    // bot.sendMessage({keyboard: [
    //     [
    //         { text: "back" }
    //     ]
    // ]})
}

function deletePrompt(chatId, messageId) {
    bot.deleteMessage(chatId, messageId)
        .catch(error => console.log('Error deleting message:', error));
}

function showBackButton(chatId, messageId) {
    bot.editMessageReplyMarkup({
        chat_id: chatId,
        message_id: messageId, // Provide the ID of the last message sent
        reply_markup: {
            keyboard: [['Back']],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
}

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if(data === "confirm_post") {
        bot.answerCallbackQuery(callbackQuery.id);
        deletePrompt(chatId, callbackQuery.message.message_id);
        requestApproval(getTenderMessage(chatId), chatId);
        return;
    }

    if(data === "approve") {
        bot.answerCallbackQuery(callbackQuery.id);
        deletePrompt(chatId, callbackQuery.message.message_id);
        await sendTenderMessage(chatId, getTenderMessage(chatId));
        return;
    }

    if(data === "reject") {
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
}

const app = express();
app.use(express.json());

app.listen(9090, () => {
    console.log("Listening on port 9090");
});
