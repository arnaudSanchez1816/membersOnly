const db = require("./pool")

module.exports.emailIsUsed = async function (email) {
    const { rows } = await db.query(
        `
        SELECT id
        FROM users
        WHERE email = $1;
        `,
        [email]
    )

    return rows.length > 0
}

module.exports.createNewUser = async function ({
    email,
    password,
    firstName,
    lastName,
}) {
    const { rows } = await db.query(
        `
        INSERT INTO users(email, password, first_name, last_name)
        VALUES ($1, $2, $3, $4) RETURNING *;
        `,
        [email, password, firstName, lastName]
    )

    return rows[0]
}

module.exports.getUserFromId = async function ({ id }) {
    const { rows } = await db.query(
        `
        SELECT *
        FROM users
        WHERE id = $1;
        `,
        [id]
    )

    return rows[0]
}

module.exports.getUserFromEmail = async function ({ email }) {
    const { rows } = await db.query(
        `
        SELECT *
        FROM users
        WHERE email = $1;
        `,
        [email]
    )

    return rows[0]
}
