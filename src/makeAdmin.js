const sqlite_1 = require("sqlite");
const sqlite3_1 = require("sqlite3");
const sql = require("sql-template-strings");

const connectToDB = async () => {
    return await sqlite_1.open({
        filename: './library.db',
        driver: sqlite3_1.Database
    });
};

async function addAdmin(username, password, email) {
    const db = await connectToDB();
    return db.run(sql`INSERT INTO admin (username, password, email) VALUES (${username}, ${password}, ${email})`);
    
}

addAdmin("Mango", "password1!", "admin@gmail.com");