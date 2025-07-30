const { body, validationResult, matchedData } = require("express-validator")
const createHttpError = require("http-errors")
const db = require("../db/queries")
const { hashPassword } = require("../utils/hashPasswordSanitizer")
const debug = require("debug")("membersOnly:router:index")
const passport = require("passport")

exports.getSignUp = function (req, res, next) {
    res.render("sign-up", {
        title: "Sign up",
        email: req.query.email,
        firstName: req.query.firstName,
        lastName: req.query.lastName,
    })
}

exports.postSignUp = [
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
    },
]

exports.getSignIn = (req, res, next) => {
    res.render("sign-in", {
        title: "Sign in",
        email: req.query.email,
        redirectTo: req.query[BODY_SIGN_IN_REDIRECT_TO],
    })
}

const BODY_SIGN_IN_REDIRECT_TO = "redirectTo"
exports.BODY_SIGN_IN_REDIRECT_TO = BODY_SIGN_IN_REDIRECT_TO

exports.postSignIn = [
    body(["email", "password"])
        .exists()
        .withMessage("Field is missing.")
        .isString()
        .notEmpty()
        .withMessage("Field must not be empty.")
        .isLength({ max: 255 })
        .withMessage("Field is too long. Maximum 255 characters allowed."),
    body("email").isEmail(),
    // Optional query redirect relative url
    body(BODY_SIGN_IN_REDIRECT_TO)
        .optional()
        .matches(/^(?!www\.|(?:http|ftp)s?:\/\/|[A-Za-z]:\\|\/\/).*/gm),
    (req, res, next) => {
        const errors = validationResult(req).array()

        const invalidRedirectTo = errors.find(
            (err) => err.path == BODY_SIGN_IN_REDIRECT_TO
        )
        if (errors.length === 1 && invalidRedirectTo) {
            // Ignore invalid redirect to urls
            return next()
        }

        if (errors.length > 0) {
            // Redirect validation errors
            req.flash(
                "error",
                errors
                    .filter((err) => err.path !== BODY_SIGN_IN_REDIRECT_TO)
                    .map((err) => err.msg)
            )
            const queryParams = new URLSearchParams()
            queryParams.append("email", req.body.email)
            if (req.body[req.body[BODY_SIGN_IN_REDIRECT_TO]]) {
                queryParams.append(
                    BODY_SIGN_IN_REDIRECT_TO,
                    req.body[BODY_SIGN_IN_REDIRECT_TO]
                )
            }
            return res.redirect(`/sign-in?${queryParams.toString()}`)
        }

        // Assign redirect url
        req.redirectTo = req.body[BODY_SIGN_IN_REDIRECT_TO]
        next()
    },
    passport.authenticate("local", {
        failWithError: true,
        failureFlash: true,
    }),
    (req, res, next) => {
        if (req.redirectTo) {
            return res.redirect(req.redirectTo)
        }

        res.redirect("/")
    },
    (error, req, res, next) => {
        // Redirect authenticate error
        const queryParams = new URLSearchParams()
        queryParams.append("email", req.body.email)
        return res.redirect(`/sign-in?${queryParams.toString()}`)
    },
]

exports.getSignOut = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err)
        }

        res.redirect("/")
    })
}

exports.getJoinClub = (req, res, next) => {
    if (!req.user) {
        const queryParams = new URLSearchParams()
        queryParams.append(BODY_SIGN_IN_REDIRECT_TO, "/join-club")
        return res.redirect(`/sign-in?${queryParams.toString()}`)
    }

    res.render("join-club", { title: "Join club" })
}

exports.postJoinClub = [
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
    },
]

exports.getHome = function (req, res, next) {
    res.render("index", { title: "Express" })
}

exports.getAdmin = (req, res, next) => {
    if (!req.user) {
        throw createHttpError(401)
    }

    res.render("admin", { title: "Administrator rights" })
}

exports.postGrantAdmin = [
    body("adminSecret")
        .exists()
        .notEmpty()
        .withMessage("Admin code is required.")
        .custom((value) => value === process.env.ADMIN_SECRET)
        .withMessage("Admin code is invalid."),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            req.flash("error", errors.formatWith((err) => err.msg).array())
            return res.redirect("/admin")
        }

        try {
            await db.toggleUserAdminRights({ id: req.user.id, isAdmin: true })
            return res.redirect("/admin")
        } catch (error) {
            throw createHttpError(500, error.message)
        }
    },
]

exports.postRevokeAdmin = [
    body("adminSecret")
        .exists()
        .notEmpty()
        .withMessage("Admin code is required.")
        .custom((value) => value === process.env.ADMIN_SECRET)
        .withMessage("Admin code is invalid."),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            req.flash("error", errors.formatWith((err) => err.msg).array())
            return res.redirect("/admin")
        }

        try {
            await db.toggleUserAdminRights({ id: req.user.id, isAdmin: false })
            return res.redirect("/admin")
        } catch (error) {
            throw createHttpError(500, error.message)
        }
    },
]
