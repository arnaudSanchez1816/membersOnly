var express = require("express")
const createHttpError = require("http-errors")
var router = express.Router()
const { body, validationResult, matchedData } = require("express-validator")
const db = require("../db/queries")
const bcrypt = require("bcryptjs")
const debug = require("debug")("router:index")

router.get("/sign-up", function (req, res, next) {
    res.render("sign-up", { title: "Sign up" })
})

router.post(
    "/sign-up",
    [
        body(["firstName", "lastName", "password", "confirmPassword", "email"])
            .exists()
            .withMessage("Field is missing.")
            .isString()
            .notEmpty()
            .withMessage("Field must not be empty.")
            .isLength({ max: 255 })
            .withMessage("Field is too long. Maximum 255 characters allowed."),
        body("email")
            .isEmail()
            .custom(async (value) => {
                // Check email is not already used
                try {
                    const emailIsUsed = await db.emailIsUsed(value)
                    if (emailIsUsed) {
                        throw new Error("E-mail already in use.")
                    }
                } catch (error) {
                    throw createHttpError(500, error.message)
                }
            }),
        body("password").isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 0,
        }),
        body("confirmPassword").custom((value, { req }) => {
            return value === req.body.password
        }),
        body("password").customSanitizer(async (value) => {
            // Return hashed password
            const salt = await bcrypt.genSalt(
                Number(process.env.PASSWORD_SALT_LENGTH)
            )
            const hashedPassword = await bcrypt.hash(value, salt)
            return hashedPassword
        }),
    ],
    async function (req, res, next) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            throw createHttpError(400, errors.array())
        }
        const { email, password, firstName, lastName } = matchedData(req)

        try {
            const newUser = await db.createNewUser({
                email,
                password,
                firstName,
                lastName,
            })
            debug(`New user created.\n${newUser}`)

            res.redirect("/")
        } catch (error) {
            throw createHttpError(500, error.message)
        }
    }
)

/* GET home page. */
router.get("/", function (req, res, next) {
    res.render("index", { title: "Express" })
})

module.exports = router
