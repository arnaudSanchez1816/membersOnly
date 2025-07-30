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

module.exports.setUserAsClubMember = async function ({ id }) {
    await db.query(
        `
        UPDATE users
        SET is_club_member = true
        WHERE id = $1;
        `,
        [id]
    )
}

module.exports.addNewMessage = async function ({
    title,
    content,
    timestamp,
    authorId,
}) {
    const { rows } = await db.query(
        `
        INSERT INTO messages(title, message, timestamp, author_id)
        VALUES($1, $2, $3, $4) RETURNING id;
        `,
        [title, content, timestamp, authorId]
    )

    return rows[0].id
}
