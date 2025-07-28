const passport = require("passport")
const passportLocal = require("passport-local").Strategy
const bcrpyt = require("bcryptjs")
const pool = require("../db/pool")

passport.use(
    new passportLocal(async (username, password, done) => {
        // Verify user
        try {
            const { rows } = await pool.query(
                `
            SELECT *
            FROM users
            WHERE email = $1;
            `,
                [username]
            )

            const user = rows[0]

            if (!user) {
                return done(null, false, {
                    message: "Incorrect username/email",
                })
            }

            const passwordMatch = await bcrpyt.compare(password, user.password)
            if (!passwordMatch) {
                return done(null, false, { message: "Incorrect password" })
            }

            return done(null, user)
        } catch (error) {
            done(error)
        }
    })
)

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM users WHERE id = $1;",
            [id]
        )
        const user = rows[0]
        done(null, user)
    } catch (error) {
        done(error)
    }
})
