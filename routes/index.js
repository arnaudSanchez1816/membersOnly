var express = require("express")
var router = express.Router()
const {
    getSignUp,
    postSignUp,
    getSignIn,
    postSignIn,
    getSignOut,
    getJoinClub,
    postJoinClub,
    getHome,
} = require("../controllers/indexController")

// Sign up
router.get("/sign-up", getSignUp)
router.post("/sign-up", postSignUp)
// Sign in
router.get("/sign-in", getSignIn)
router.post("/sign-in", postSignIn)
// Sign out
router.get("/sign-out", getSignOut)
// Join Club
router.get("/join-club", getJoinClub)
router.post("/join-club", postJoinClub)
// Home page
router.get("/", getHome)

module.exports = router
