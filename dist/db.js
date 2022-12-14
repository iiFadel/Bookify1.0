"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = __importDefault(require("sqlite"));
const sql_template_strings_1 = __importDefault(require("sql-template-strings"));
const connectToDB = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield sqlite_1.open({
        filename: './library.db',
        driver: sqlite3_1.default.Database
    });
});
// add a user to the database
function addUser(username, password, email) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        return yield db.run((0, sql_template_strings_1.default) `INSERT INTO user (username, password, email) VALUES (${username}, ${password}, ${email})`);
    });
}
// get user by username
function getUser(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        const user = yield db.get((0, sql_template_strings_1.default) `SELECT * FROM user WHERE username = ${username}`);
        return user;
    });
}
// get user by id
function getUserById(user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        const user = yield db.get((0, sql_template_strings_1.default) `SELECT * FROM user WHERE user_id = ${user_id}`);
        return user;
    });
}
// add to saved books 
function addSavedBook(user_id, book_isbn) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        return yield db.run((0, sql_template_strings_1.default) `INSERT INTO saved_book (user_id, book_isbn) VALUES (${user_id}, ${book_isbn})`);
    });
}
// get saved books by user_id
function getSavedBooks(user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        const saved_books = yield db.all((0, sql_template_strings_1.default) `SELECT book_isbn FROM saved_book WHERE user_id = ${user_id}`);
        return saved_books;
    });
}
// remove saved book
function removeSavedBook(user_id, book_isbn) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        return yield db.run((0, sql_template_strings_1.default) `DELETE FROM saved_book WHERE user_id = ${user_id} AND book_isbn = ${book_isbn}`);
    });
}
// add a book
function addBook(isbn, title, admin_id, pdfPath, authors, description, publisher, subject, language, coverImagePath, release_date) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        return yield db.run((0, sql_template_strings_1.default) `INSERT INTO book (book_isbn, title, added_by, pdf, authors, description, publisher, subject, language, cover_photo, release_date) VALUES (${isbn}, ${title}, ${admin_id}, ${pdfPath}, ${authors}, ${description}, ${publisher}, ${subject}, ${language}, ${coverImagePath}, ${release_date})`);
    });
}
// remove a book
function removeBook(isbn) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        return yield db.run((0, sql_template_strings_1.default) `DELETE FROM book WHERE book_isbn = ${isbn}`);
    });
}
// get multiple books by isbn
function getBooks(isbn) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        const books = yield db.all((0, sql_template_strings_1.default) `SELECT * FROM book WHERE book_isbn IN (${isbn})`);
        return books;
    });
}
// add an admin
function addAdmin(username, password, email) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        return yield db.run((0, sql_template_strings_1.default) `INSERT INTO admin (username, password, email) VALUES (${username}, ${password}, ${email})`);
    });
}
// get admin by username
function getAdmin(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        const admin = yield db.get((0, sql_template_strings_1.default) `SELECT * FROM admin WHERE username = ${username}`);
        return admin;
    });
}
// get admin by id
function getAdminById(admin_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        const admin = yield db.get((0, sql_template_strings_1.default) `SELECT * FROM admin WHERE admin_id = ${admin_id}`);
        return admin;
    });
}
// add a book review
function addReview(user_id, book_isbn, text, rating) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        return yield db.run((0, sql_template_strings_1.default) `INSERT INTO review (user_id, book_isbn, text, rating) VALUES (${user_id}, ${book_isbn}, ${text}, ${rating})`);
    });
}
// get reviews by book_isbn
function getReviews(book_isbn) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        const reviews = yield db.all((0, sql_template_strings_1.default) `SELECT r.text, r.rating, u.username FROM review r JOIN user u ON u.user_id = r. user_id WHERE book_isbn = ${book_isbn}`);
        return reviews;
    });
}
// add a book request
function addRequest(user_id, title, isbn, author) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        return yield db.run((0, sql_template_strings_1.default) `INSERT INTO book_request (title, isbn, authors, submitted_by, updated_by, status) VALUES (${title}, ${isbn}, ${author}, ${user_id}, ${null}, 'pending')`);
    });
}
// get book requests 
// @param status: pending, approved, rejected
function getRequests(status) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        if (status === 'pending') {
            return yield db.all((0, sql_template_strings_1.default) `SELECT * FROM book_request WHERE status = 'pending'`);
        }
        else if (status === 'approved') {
            return yield db.all((0, sql_template_strings_1.default) `SELECT * FROM book_request WHERE status = 'approved'`);
        }
        else if (status === 'rejected') {
            return yield db.all((0, sql_template_strings_1.default) `SELECT * FROM book_request WHERE status = 'rejected'`);
        }
        else {
            return yield db.all((0, sql_template_strings_1.default) `SELECT * FROM book_request`);
        }
    });
}
// update book request status
function updateRequestStatus(request_id, status, updated_by) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        return yield db.run((0, sql_template_strings_1.default) `UPDATE book_request SET status = ${status}, updated_by = ${updated_by} WHERE request_id = ${request_id}`);
    });
}
// get user by email
function getUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        const user = yield db.get((0, sql_template_strings_1.default) `SELECT * FROM user WHERE email = ${email}`);
        return user;
    });
}
// get admin by email
function getAdminByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        const admin = yield db.get((0, sql_template_strings_1.default) `SELECT * FROM admin WHERE email = ${email}`);
        return admin;
    });
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
function searchBook(isbn, title, author, subject, language, publisher, description, release_date) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        if (isbn) {
            return yield db.all((0, sql_template_strings_1.default) `SELECT book_isbn FROM book WHERE book_isbn = ${isbn}`);
        }
        else if (title || author || subject || language || publisher || description || release_date) {
            return yield db.all((0, sql_template_strings_1.default) `SELECT book_isbn FROM book WHERE 
                title LIKE '%${title}%'
                ${(author) ? ` AND authors LIKE '%${author}%'` : ''}
                ${(subject) ? ` AND subject LIKE '%${subject}%'` : ''}
                ${(language) ? ` AND language LIKE '%${language}%'` : ''}
                ${(publisher) ? ` AND publisher LIKE '%${publisher}%'` : ''}
                ${(description) ? ` AND description LIKE '%${description}%'` : ''}
                ${(release_date) ? ` AND release_date LIKE '%${release_date}%'` : ''}
            `);
        }
        throw new Error("No search criteria provided.");
    });
}
// by term search
function searchBookByTerm(term) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        return yield db.all((0, sql_template_strings_1.default) `SELECT book_isbn FROM book WHERE title LIKE '%Room%'`);
        // OR authors LIKE '%${term}%'
        // OR subject LIKE '%${term}%'
        // OR language LIKE '%${term}%'
        // OR publisher LIKE '%${term}%'
        // OR description LIKE '%${term}%'
        // OR release_date LIKE '%${term}%'
    });
}
exports.default = {
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
};
