const passport = require("passport")
const passportLocal = require("passport-local").Strategy
const bcrpyt = require("bcryptjs")
const db = require("../db/queries")

const INCORRECT_USERNAME_PASSWORD_MESSAGE = "Incorrect e-mail or password."

passport.use(
    new passportLocal(
        {
            usernameField: "email",
            passwordField: "password",
            passReqToCallback: true,
        },
        async (req, username, password, done) => {
            // Verify user
            try {
                // Reset session messages
                if (req.session) {
                    req.session.messages = []
                }
                const user = await db.getUserFromEmail({ email: username })

                if (!user) {
                    return done(null, false, {
                        message: INCORRECT_USERNAME_PASSWORD_MESSAGE,
                    })
                }

                const passwordMatch = await bcrpyt.compare(
                    password,
                    user.password
                )
                if (!passwordMatch) {
                    return done(null, false, {
                        message: INCORRECT_USERNAME_PASSWORD_MESSAGE,
                    })
                }

                return done(null, user)
            } catch (error) {
                done(error)
            }
        }
    )
)

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await db.getUserFromId({ id })
        done(null, user)
    } catch (error) {
        done(error)
    }
})
