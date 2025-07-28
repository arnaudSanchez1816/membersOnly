const bcrypt = require("bcryptjs")

async function hashPassword(value) {
    // Return hashed password
    const salt = await bcrypt.genSalt(Number(process.env.PASSWORD_SALT_LENGTH))
    const hashedPassword = await bcrypt.hash(value, salt)
    return hashedPassword
}

module.exports = { hashPassword }
