const express = require("express")
const {
    getNewMessage,
    postNewMessage,
    getMessages,
    getDeleteMessage,
} = require("../controllers/messagesController")
const router = express.Router()

router.get("/new", getNewMessage)
router.post("/new", postNewMessage)

router.get("/delete", getDeleteMessage)

router.get("/", getMessages)

module.exports = router
