import sqlite3 from 'sqlite3';
import sqlite from 'sqlite';
import sql from 'sql-template-strings';

const connectToDB = async () => {
    return await sqlite.open({
        filename: './library.db',
        driver: sqlite3.Database
      });
}

// add a user to the database
async function addUser(username: string, password: string, email: string): Promise<sqlite.ISqlite.RunResult<sqlite3.Statement>> {
    const db = await connectToDB();
    return await db.run(sql`INSERT INTO user (username, password, email) VALUES (${username}, ${password}, ${email})`);
}

// get user by username
async function getUser(username: string): Promise<any> {
    const db = await connectToDB();
    const user = await db.get(sql`SELECT * FROM user WHERE username = ${username}`);
    return user;
}

// get user by id
async function getUserById(user_id: number): Promise<any> {
    const db = await connectToDB();
    const user = await db.get(sql`SELECT * FROM user WHERE user_id = ${user_id}`);
    return user;
}

// add to saved books 
async function addSavedBook(user_id: number, book_isbn: number): Promise<sqlite.ISqlite.RunResult<sqlite3.Statement>> {
    const db = await connectToDB();
    return await db.run(sql`INSERT INTO saved_book (user_id, book_isbn) VALUES (${user_id}, ${book_isbn})`);
}

// get saved books by user_id
async function getSavedBooks(user_id: number): Promise<Array<any>> {
    const db = await connectToDB();
    const saved_books = await db.all(sql`SELECT book_isbn FROM saved_book WHERE user_id = ${user_id}`);
    return saved_books;
}

// remove saved book
async function removeSavedBook(user_id: number, book_isbn: number): Promise<sqlite.ISqlite.RunResult<sqlite3.Statement>> {
    const db = await connectToDB();
    return await db.run(sql`DELETE FROM saved_book WHERE user_id = ${user_id} AND book_isbn = ${book_isbn}`);
}

// add a book
async function addBook(isbn: number, title: string, admin_id: number, pdfPath: string, authors?: string, description?: string, publisher?:string, subject?:string, language?:string, coverImagePath?: string, release_date?:string): Promise<sqlite.ISqlite.RunResult<sqlite3.Statement>> {
    const db = await connectToDB();
    return await db.run(sql`INSERT INTO book (book_isbn, title, added_by, pdf, authors, description, publisher, subject, language, cover_photo, release_date) VALUES (${isbn}, ${title}, ${admin_id}, ${pdfPath}, ${authors}, ${description}, ${publisher}, ${subject}, ${language}, ${coverImagePath}, ${release_date})`);
}

// remove a book
async function removeBook(isbn: number): Promise<sqlite.ISqlite.RunResult<sqlite3.Statement>> {
    const db = await connectToDB();
    return await db.run(sql`DELETE FROM book WHERE book_isbn = ${isbn}`);
}

// get multiple books by isbn
async function getBooks(isbn: Array<number>): Promise<Array<any>> {
    const db = await connectToDB();
    const books = await db.all(sql`SELECT * FROM book WHERE book_isbn IN (${isbn})`);
    return books;
}

// add an admin
async function addAdmin(username: string, password: string, email: string): Promise<sqlite.ISqlite.RunResult<sqlite3.Statement>> {
    const db = await connectToDB();
    return await db.run(sql`INSERT INTO admin (username, password, email) VALUES (${username}, ${password}, ${email})`);
}

// get admin by username
async function getAdmin(username: string): Promise<any> {
    const db = await connectToDB();
    const admin = await db.get(sql`SELECT * FROM admin WHERE username = ${username}`);
    return admin;
}

// get admin by id
async function getAdminById(admin_id: number): Promise<any> {
    const db = await connectToDB();
    const admin = await db.get(sql`SELECT * FROM admin WHERE admin_id = ${admin_id}`);
    return admin;
}

// add a book review
async function addReview(user_id: number, book_isbn: number, text: string, rating: number): Promise<sqlite.ISqlite.RunResult<sqlite3.Statement>> {
    const db = await connectToDB();
    return await db.run(sql`INSERT INTO review (user_id, book_isbn, text, rating) VALUES (${user_id}, ${book_isbn}, ${text}, ${rating})`);
}

// get reviews by book_isbn
async function getReviews(book_isbn: number): Promise<Array<any>> {
    const db = await connectToDB();
    const reviews = await db.all(sql`SELECT r.text, r.rating, u.username FROM review r JOIN user u ON u.user_id = r. user_id WHERE book_isbn = ${book_isbn}`);
    return reviews;
}

// add a book request
async function addRequest(user_id: number, title: string, isbn:number, author?:string): Promise<sqlite.ISqlite.RunResult<sqlite3.Statement>> {
    const db = await connectToDB();
    return await db.run(sql`INSERT INTO book_request (title, isbn, authors, submitted_by, updated_by, status) VALUES (${title}, ${isbn}, ${author}, ${user_id}, ${null}, 'pending')`);
}

// get book requests 
// @param status: pending, approved, rejected
async function getRequests(status?:string): Promise<Array<any>> {
    const db = await connectToDB();
    if (status==='pending') {
        return await db.all(sql`SELECT * FROM book_request WHERE status = 'pending'`);
    } else if (status==='approved') {
        return await db.all(sql`SELECT * FROM book_request WHERE status = 'approved'`);
    } else if (status==='rejected') {
        return await db.all(sql`SELECT * FROM book_request WHERE status = 'rejected'`);
    } else {
        return await db.all(sql`SELECT * FROM book_request`);
    }
}

// update book request status
async function updateRequestStatus(request_id: number, status: string, updated_by: number): Promise<sqlite.ISqlite.RunResult<sqlite3.Statement>> {
    const db = await connectToDB();
    return await db.run(sql`UPDATE book_request SET status = ${status}, updated_by = ${updated_by} WHERE request_id = ${request_id}`);
}

// get user by email
async function getUserByEmail(email: string): Promise<any> {
    const db = await connectToDB();
    const user = await db.get(sql`SELECT * FROM user WHERE email = ${email}`);
    return user;
}

// get admin by email
async function getAdminByEmail(email: string): Promise<any> {
    const db = await connectToDB();
    const admin = await db.get(sql`SELECT * FROM admin WHERE email = ${email}`);
    return admin;
}

// search for a book
// @param isbn: isbn of the book
// @param title: title of the book
// @param author: author of the book
// @param subject: subject of the book
// @param language: language of the book
// @param publisher: publisher of the book
// @param description: description of the book
// @param release_date: release date of the book
async function searchBook(isbn?: number, title?: string, author?: string, subject?: string, language?: string, publisher?: string, description?: string, release_date?: string): Promise<Array<any>> {
    const db = await connectToDB();
    if (isbn) {
        return await db.all(sql`SELECT book_isbn FROM book WHERE book_isbn = ${isbn}`);
    } else if (title || author || subject || language || publisher || description || release_date) {
        return await db.all(sql`SELECT book_isbn FROM book WHERE 
                title LIKE '%${title}%'
                ${(author)?` AND authors LIKE '%${author}%'`:''}
                ${(subject)?` AND subject LIKE '%${subject}%'`:''}
                ${(language)?` AND language LIKE '%${language}%'`:''}
                ${(publisher)?` AND publisher LIKE '%${publisher}%'`:''}
                ${(description)?` AND description LIKE '%${description}%'`:''}
                ${(release_date)?` AND release_date LIKE '%${release_date}%'`:''}
            `);
    }
    throw new Error("No search criteria provided.");
}

// by term search
async function searchBookByTerm(term: string): Promise<Array<any>> {
    const db = await connectToDB();
    return await db.all(sql`SELECT book_isbn FROM book WHERE title LIKE '%Room%'`);
                // OR authors LIKE '%${term}%'
                // OR subject LIKE '%${term}%'
                // OR language LIKE '%${term}%'
                // OR publisher LIKE '%${term}%'
                // OR description LIKE '%${term}%'
                // OR release_date LIKE '%${term}%'
}
export default {
    addUser,
    getUser,
    getUserById,
    addSavedBook,
    getSavedBooks,
    removeSavedBook,
    addBook,
    getBooks,
    addAdmin,
    getAdmin,
    getAdminById,
    addReview,
    getReviews,
    addRequest,
    getRequests,
    updateRequestStatus,
    getUserByEmail,
    getAdminByEmail,
    searchBook,
    searchBookByTerm,
    removeBook
}
