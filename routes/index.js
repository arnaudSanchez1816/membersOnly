var express = require("express")
const createHttpError = require("http-errors")
var router = express.Router()
const { body, validationResult, matchedData } = require("express-validator")
const db = require("../db/queries")
const debug = require("debug")("membersOnly:router:index")
const { hashPassword } = require("../utils/hashPasswordSanitizer")
const passport = require("passport")

router.get("/sign-up", function (req, res, next) {
    res.render("sign-up", {
        title: "Sign up",
        email: req.query.email,
        firstName: req.query.firstName,
        lastName: req.query.lastName,
    })
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
            .withMessage("Invalid e-mail.")
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
            })
            .withMessage("E-mail provided is already in use."),
        body("password")
            .isStrongPassword({
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 0,
            })
            .withMessage(
                "Invalid password. A valid password must be at least 8 characters long and contain at least 1 lower case character, 1 upper case character and 1 number."
            ),
        body("confirmPassword")
            .custom((value, { req }) => {
                return value === req.body.password
            })
            .withMessage(
                "The password and password confirmation fields must be identical."
            ),
        body("password").customSanitizer(hashPassword),
    ],
    async function (req, res, next) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            req.flash(
                "error",
                errors.array().map((err) => err.msg)
            )
            const queryParams = new URLSearchParams()
            queryParams.append("email", req.body.email)
            queryParams.append("firstName", req.body.firstName)
            queryParams.append("lastName", req.body.lastName)
            return res.redirect(`/sign-up?${queryParams.toString()}`)
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

            req.login(newUser, function (err) {
                if (err) {
                    return next(err)
                }
                return res.redirect("/")
            })
        } catch (error) {
            throw createHttpError(500, error.message)
        }
    }
)

router.get("/sign-in", (req, res, next) => {
    res.render("sign-in", { title: "Sign in", email: req.query.email })
})

router.post(
    "/sign-in",
    [
        body(["email", "password"])
            .exists()
            .withMessage("Field is missing.")
            .isString()
            .notEmpty()
            .withMessage("Field must not be empty.")
            .isLength({ max: 255 })
            .withMessage("Field is too long. Maximum 255 characters allowed."),
        body("email").isEmail(),
    ],
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            // Redirect validation errors
            req.flash(
                "error",
                errors.array().map((err) => err.msg)
            )
            const queryParams = new URLSearchParams()
            queryParams.append("email", req.body.email)
            return res.redirect(`/sign-in?${queryParams.toString()}`)
        }

        next()
    },
    passport.authenticate("local", {
        successRedirect: "/",
        failWithError: true,
        failureFlash: true,
    }),
    (error, req, res, next) => {
        // Redirect authenticate error
        const queryParams = new URLSearchParams()
        queryParams.append("email", req.body.email)
        return res.redirect(`/sign-in?${queryParams.toString()}`)
    }
)

router.get("/sign-out", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err)
        }

        res.redirect("/")
    })
})

router.get("/join-club", (req, res, next) => {
    if (!req.user) {
        return res.redirect("/sign-in")
    }

    res.render("join-club", { title: "Join club" })
})

router.post(
    "/join-club",
    (req, res, next) => {
        if (!req.user) {
            return createHttpError(401, "You are not signed in.")
        }
        next()
    },
    [
        body("clubInviteCode")
            .exists()
            .notEmpty()
            .custom((value) => {
                return value === process.env.CLUB_INVITE_CODE
            })
            .withMessage("Invalid invite code."),
    ],
    async (req, res, next) => {
        if (req.user.isMember) {
            return res.redirect("/join-club")
        }

        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            req.flash(
                "error",
                errors.array().map((err) => err.msg)
            )
            return res.redirect("/join-club")
        }

        try {
            const userId = req.user.id

            await db.setUserAsClubMember({ id: userId })
            res.redirect("/")
        } catch (error) {
            next(error)
        }
    }
)

/* GET home page. */
router.get("/", function (req, res, next) {
    res.render("index", { title: "Express" })
})

module.exports = router
