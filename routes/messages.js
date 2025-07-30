const express = require("express")
const {
    getNewMessage,
    postNewMessage,
} = require("../controllers/messagesController")
const router = express.Router()

router.get("/new", getNewMessage)
router.post("/new", postNewMessage)

module.exports = router
