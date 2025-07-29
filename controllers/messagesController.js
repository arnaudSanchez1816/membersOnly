const { BODY_SIGN_IN_REDIRECT_TO } = require("./indexController")

exports.getNewMessage = (req, res, next) => {
    if (!req.user) {
        const queryParams = new URLSearchParams()
        queryParams.append(BODY_SIGN_IN_REDIRECT_TO, "/messages/new")
        return res.redirect(`/sign-in?${queryParams.toString()}`)
    }

    res.render("messages/new", { title: "New Message" })
}
