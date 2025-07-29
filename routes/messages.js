const express = require("express")
const { getNewMessage } = require("../controllers/messagesController")
const router = express.Router()

router.get("/new", getNewMessage)

module.exports = router
