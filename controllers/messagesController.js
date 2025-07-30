const createHttpError = require("http-errors")
const { BODY_SIGN_IN_REDIRECT_TO } = require("./indexController")
const {
    body,
    validationResult,
    matchedData,
    query,
} = require("express-validator")
const db = require("../db/queries")
const debug = require("debug")("membersOnly:router:messages")

exports.getNewMessage = (req, res, next) => {
    if (!req.user) {
        const queryParams = new URLSearchParams()
        queryParams.append(BODY_SIGN_IN_REDIRECT_TO, "/messages/new")
        return res.redirect(`/sign-in?${queryParams.toString()}`)
    }

    res.render("messages/new", { title: "New Message" })
}

exports.postNewMessage = [
    (req, res, next) => {
        if (!req.user) {
            throw createHttpError(401)
        }
        next()
    },
    body("title")
        .escape()
        .exists()
        .withMessage("Title required.")
        .isLength({ max: 255 })
        .withMessage("Title must be less than 256 characters."),
    body("content").trim().escape().default(""),
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            throw createHttpError(
                400,
                errors.formatWith((err) => err.msg).array()
            )
        }
        next()
    },
    async (req, res, next) => {
        const { title, content } = matchedData(req)
        const userId = req.user.id
        try {
            const messageId = await db.addNewMessage({
                title,
                content,
                timestamp: new Date(),
                authorId: userId,
            })
            debug(`New Message created, id: ${messageId}`)
            res.redirect("/")
        } catch (error) {
            throw createHttpError(500, error.message)
        }
    },
]

exports.getMessages = async (req, res, next) => {
    try {
        const messages = await db.getAllMessages()
        res.render("messages/messages", {
            title: "All messages",
            messages: messages,
        })
    } catch (error) {
        throw createHttpError(500, error.message)
    }
}

exports.getDeleteMessage = [
    (req, rest, next) => {
        if (!req.user || !req.user.isAdmin) {
            throw createHttpError(
                401,
                "You do not have permissions to delete messages."
            )
        }
        next()
    },
    query("id")
        .trim()
        .escape()
        .exists()
        .isInt()
        .withMessage("Invalid message id")
        .toInt(),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            throw createHttpError(
                400,
                errors.formatWith((err) => err.msg).array()
            )
        }

        const { id } = matchedData(req)
        try {
            await db.deleteMessage({ id })
            res.redirect("/messages")
        } catch (error) {
            throw createHttpError(500, error.message)
        }
    },
]
