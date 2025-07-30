const express = require("express")
const {
    getNewMessage,
    postNewMessage,
    getMessages,
} = require("../controllers/messagesController")
const router = express.Router()

router.get("/new", getNewMessage)
router.post("/new", postNewMessage)

router.get("/", getMessages)

module.exports = router
