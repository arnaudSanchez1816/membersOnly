const { Pool } = require("pg")
const humps = require("humps")

if (process.env.LOG_QUERIES === "true") {
    const Query = require("pg").Query
    const submit = Query.prototype.submit
    Query.prototype.submit = function () {
        const text = this.text
        const values = this.values || []
        const query = text.replace(/\$([0-9]+)/g, (m, v) =>
            JSON.stringify(values[parseInt(v) - 1])
        )
        console.log(query)
        submit.apply(this, arguments)
    }
}

// Camelize query result rows
const query = Pool.prototype.query
Pool.prototype.query = async function () {
    const results = await query.apply(this, arguments)
    const newResults = {
        ...results,
        rows: humps.camelizeKeys(results.rows),
    }
    return newResults
}

module.exports = new Pool()
