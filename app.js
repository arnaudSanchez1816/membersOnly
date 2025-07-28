require("dotenv").config()
var createError = require("http-errors")
var express = require("express")
const session = require("express-session")
var path = require("path")
var cookieParser = require("cookie-parser")
var logger = require("morgan")
const passport = require("passport")
const pool = require("./db/pool")

var indexRouter = require("./routes/index")
var usersRouter = require("./routes/users")

var app = express()

// view engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")))
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: new (require("connect-pg-simple")(session))({
            // Insert connect-pg-simple options here
            pool: pool,
            createTableIfMissing: true,
        }),
        cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    })
)

// Init passport
require("./passport/passportSetup")
app.use(passport.initialize())
app.use(passport.session())

// Add user to locals
app.use((req, res, next) => {
    res.locals.user = req.user
    next()
})

app.use("/", indexRouter)
app.use("/users", usersRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get("env") === "development" ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render("error")
})

module.exports = app
