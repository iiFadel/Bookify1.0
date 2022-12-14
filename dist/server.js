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
const validation_1 = require("./validation");
const express_session_1 = __importDefault(require("express-session"));
const nunjucks_1 = __importDefault(require("nunjucks"));
const multer_1 = __importDefault(require("multer"));
const db_1 = __importDefault(require("./db"));
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 3000;
// configure nunjucks templates
nunjucks_1.default.configure('views', { express: app, autoescape: true });
// middleware
app.use(express_1.default.static('public'));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    secret: '89u7564hr4yt6bv43nejc46dwsx',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/' + file.fieldname);
    },
    filename: function (req, file, cb) {
        cb(null, req.body.isbn + '.' + file.originalname.split('.').pop());
    }
});
const upload = (0, multer_1.default)({ storage: storage });
//**** ROUTES ****//
// root
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if ((_a = req.session) === null || _a === void 0 ? void 0 : _a.admin) {
        res.render('index.html', { signedIn: true, username: req.session.username, admin: true }); // render admin version
    }
    else if ((_b = req.session) === null || _b === void 0 ? void 0 : _b.username) {
        res.render('index.html', { signedIn: true, username: req.session.username, admin: false }); // render logged in version
    }
    else {
        res.render('index.html', { signedIn: false }); // render logged out version
    }
}));
//** login/register **//
// register
app.get('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    if ((_c = req.session) === null || _c === void 0 ? void 0 : _c.username) {
        res.redirect('/');
    }
    else {
        res.render('register.html');
    }
}));
app.post('/register', (0, validation_1.validate)([validation_1.newUsernameSchema, validation_1.newPasswordSchema, validation_1.emailSchema]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, email } = req.body;
    console.log(req.body);
    // check if user already exists
    const userExists = yield db_1.default.getUser(username);
    const emailExists = yield db_1.default.getUserByEmail(email);
    if (userExists) {
        res.status(400).render('register.html', { errors: [{ msg: 'Username already in use' }], username: username, email: email });
    }
    else if (emailExists) {
        res.status(400).render('register.html', { errors: [{ msg: 'Email already in use' }], username: username, email: email });
    }
    else {
        const hashedPassword = password; //await bcrypt.hash(password, 10);
        yield db_1.default.addUser(username, hashedPassword, email);
        // ? pop up message saying account created
        res.redirect('/login');
    }
}));
// login
app.get('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    if ((_d = req.session) === null || _d === void 0 ? void 0 : _d.username) {
        res.redirect('/');
    }
    else {
        res.render('login.html');
    }
}));
app.post('/login', validation_1.sanitizePassword, validation_1.sanitizeUsername, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    if ((_e = req.session) === null || _e === void 0 ? void 0 : _e.username) {
        res.redirect('/');
        return;
    }
    const { username, password } = req.body;
    // check if user exists
    const user = yield db_1.default.getUser(username);
    if (user) {
        // const match = await bcrypt.compare(password, user.password);
        // console.log(match);
        if (password == user.password) {
            // initialize session
            req.session.username = user.username;
            req.session.user_id = user.user_id;
            req.session.admin = false;
            res.redirect('/');
            return;
        }
    }
    // check if user is an admin
    const admin = yield db_1.default.getAdmin(username);
    console.log(admin);
    console.log(username);
    if (admin) {
        // const match = await bcrypt.compare(password, admin.password);
        if (password == admin.password) {
            // initialize session
            req.session.username = admin.username;
            req.session.user_id = admin.admin_id;
            req.session.admin = true;
            res.redirect('/');
            return;
        }
    }
    res.status(400).render('login.html', { error: 'Credentials invalid', username: username });
}));
// logout
app.get('/logout', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    if (!((_f = req.session) === null || _f === void 0 ? void 0 : _f.username)) {
        res.redirect('/');
        return;
    }
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect('/');
        }
    });
}));
//** Books **//
// get book page
app.get('/book/:book_isbn', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const book_isbn = Number(req.params.book_isbn);
    const book = yield db_1.default.getBooks([book_isbn]);
    res.render('bookPage.html', book[0]);
}));
// get saved books page
app.get('/bookmarks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h;
    if ((_g = req.session) === null || _g === void 0 ? void 0 : _g.admin) {
        res.status(403).send('Admins cannot have saved books');
        return;
    }
    if (!((_h = req.session) === null || _h === void 0 ? void 0 : _h.user_id)) {
        res.redirect('/login');
        return;
    }
    const user_id = Number(req.session.user_id);
    const books = yield db_1.default.getSavedBooks(user_id); //get the book isbn's 
    const bookInfo = yield db_1.default.getBooks(books); // get the book infos
    res.render('bookmark.html', { books: bookInfo, username: req.session.username, admin: req.session.admin });
}));
// read a book
app.get('/book/:book_isbn/read', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const book_isbn = Number(req.params.book_isbn);
    const book = yield db_1.default.getBooks([book_isbn]);
    res.render('read-book.html', book[0]);
}));
// get reviews about a book
app.get('/book/:book_isbn/reviews', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const book_isbn = Number(req.params.book_isbn);
    const reviews = yield db_1.default.getReviews(book_isbn);
    res.send(JSON.stringify(reviews));
}));
// save a book
app.post('/book/:book_isbn/save', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k;
    if ((_j = req.session) === null || _j === void 0 ? void 0 : _j.admin) {
        res.status(403).send('Admins cannot save books');
        return;
    }
    if (!((_k = req.session) === null || _k === void 0 ? void 0 : _k.user_id)) {
        res.redirect('/login');
        return;
    }
    const book_isbn = Number(req.params.book_isbn);
    const user_id = req.session.user_id;
    const saved = yield db_1.default.addSavedBook(user_id, book_isbn);
    res.render('success.html', { operation: "Book saved Successfully" });
}));
// add a review about a book
app.post('/book/:book_isbn/reviews', (0, validation_1.validate)([validation_1.commentSchema]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _l, _m;
    // dont accept reviews from admins
    if ((_l = req.session) === null || _l === void 0 ? void 0 : _l.admin) {
        res.status(403).send('Admins cannot review books');
        return;
    }
    // check if user is logged in
    if (!((_m = req.session) === null || _m === void 0 ? void 0 : _m.user_id)) {
        res.redirect('/login');
        return;
    }
    const book_isbn = Number(req.params.book_isbn);
    const comment = req.body.comment;
    const rating = Number(req.body.rating);
    const user_id = req.session.user_id;
    const review = yield db_1.default.addReview(user_id, book_isbn, comment, rating);
    res.send(JSON.stringify(review));
}));
// reading view of a book
// just send pdf file and let the browser handle it
app.get('/book/:book_isbn/reading', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // todo add a reading page
    const book_isbn = Number(req.params.book_isbn);
    const book = yield db_1.default.getBooks([book_isbn]);
    res.redirect('/pdf/' + book[0].pdf);
}));
//** Search books **//
// search for books
// get advanced search form
// app.get('/advancedSearch', async (req: Request, res: Response) => {
//     res.render('advancedSearch.html');
// });
// type searchRequest = {
//     isbn?: number;
//     title?: string;
//     author?: string;
//     subject?: string;
//     publisher?: string;
//     language?: string;
//     description?: string;
//     release_date?: string;
// }
// // post advanced search form
// // advanced search queries should be in the following format:
// // http://127.0.0.1:3000/query?isbn=123&title=hello&author=world
// app.post('/advancedsearch', async (req: Request, res: Response) => {
//     try {
//         const searchRequest: searchRequest = req.query;
//         const isbns = await db.searchBook(searchRequest.isbn, searchRequest.title, searchRequest.author, searchRequest.subject, searchRequest.language, searchRequest.publisher, searchRequest.description, searchRequest.release_date);
//         const books = await db.getBooks(isbns);
//         res.render('searchResult.html', { books: books });
//     } catch (error) {
//         console.log(error);
//         res.status(400).send('Bad request');
//     }
// });
// post search form
app.post('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _o, _p;
    const searchTerm = req.body.term;
    if (searchTerm) {
        console.log(searchTerm);
        const isbns = yield db_1.default.searchBookByTerm(searchTerm);
        let arr = [];
        for (let i = 0; i < isbns.length; i++) {
            arr.push(isbns[i].book_isbn);
        }
        const books = yield db_1.default.getBooks(arr);
        res.render('search.html', { term: searchTerm, books: books, username: (_o = req.session) === null || _o === void 0 ? void 0 : _o.username, admin: (_p = req.session) === null || _p === void 0 ? void 0 : _p.admin });
    }
    else {
        res.status(400).send('Bad request');
    }
}));
//** Requests **//
// book request form
app.get('/request', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _q, _r;
    if ((_q = req.session) === null || _q === void 0 ? void 0 : _q.admin) {
        res.status(403).send('Admins cannot request books');
        return;
    }
    if (!((_r = req.session) === null || _r === void 0 ? void 0 : _r.user_id)) {
        res.redirect('/login');
        return;
    }
    res.render('request.html', { username: req.session.username, admin: req.session.admin });
}));
// post book request form
// form should include title and a short letter
app.post('/request', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _s, _t;
    if ((_s = req.session) === null || _s === void 0 ? void 0 : _s.admin) {
        res.status(403).send('Admins cannot request books');
        return;
    }
    else if (!((_t = req.session) === null || _t === void 0 ? void 0 : _t.user_id)) {
        res.redirect('/login');
        return;
    }
    const { title, isbn } = req.body;
    const author = req.body.author;
    const user_id = Number(req.session.user_id);
    const request = yield db_1.default.addRequest(user_id, title, isbn, author);
    res.redirect('/');
}));
// admin view all requests
app.get('/requests', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.admin) {
        res.status(403).send('this page is not for you friend');
        return;
    }
    const requests = yield db_1.default.getRequests(req.body.status);
    res.render('view-request.html', { requests, username: req.session.username, admin: req.session.admin });
}));
// admin update a request
// include status and request_id in the body
app.put('/requests', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.admin || !req.session.user_id) {
        res.status(403).send('this page is not for you friend');
        return;
    }
    try {
        const request_id = Number(req.body.request_id);
        const status = req.body.status;
        const request = yield db_1.default.updateRequestStatus(request_id, status, req.session.user_id);
        res.send(JSON.stringify(request));
    }
    catch (error) {
        res.status(400).send('bad request');
        console.log(error);
    }
}));
//** Admin add/update book **//
// admin add book form
app.get('/addbook', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.admin) {
        res.status(403).send('this page is not for you friend');
        return;
    }
    res.render('addBook.html', { username: req.session.username, admin: req.session.admin });
}));
// admin add book
// Don't forget the enctype="multipart/form-data" in your form https://www.npmjs.com/package/multer
// the field name for the pdf file and the image MUST be "pdf" and "cover" respectively
app.post('/addbook', upload.fields([{ name: 'pdf' }, { name: 'cover' }]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _u;
    if (!((_u = req.session) === null || _u === void 0 ? void 0 : _u.admin)) {
        res.status(403).send('this page is not for you friend');
        return;
    }
    if (!req.files) {
        res.status(400).send('bad request');
        return;
    }
    const files = req.files;
    console.log(req.session.user_id);
    try {
        const { isbn, title, authors, subject, language, publisher, description, release_date } = req.body;
        const book = yield db_1.default.addBook(Number(isbn), title, req.session.user_id, String(isbn) + '.pdf', authors, description, publisher, subject, language, String(isbn) + '.' + files['cover'][0].originalname.split('.').pop(), release_date);
        res.render('success.html', { operation: "Book added Successfully", canagain: true, again: "/addbook", }); //? maybe add a page that tells the admin that the book has been added?
    }
    catch (error) {
        console.log(error);
        res.status(400).send('bad request');
    }
}));
// admin update book form
app.get('/updatebook/:book_isbn', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.admin || !req.session.user_id) {
        res.status(403).send('this page is not for you friend');
        return;
    }
    const book = yield db_1.default.getBooks([Number(req.params.book_isbn)]);
    res.render('addBook.html', book[0]);
}));
// admin update book
// Don't forget the enctype="multipart/form-data" in your form https://www.npmjs.com/package/multer
// the field name for the pdf file and the image MUST be "pdf" and "cover" respectively
app.put('/updatebook/:book_isbn', upload.fields([{ name: 'pdf' }, { name: 'cover' }]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.admin || !req.session.user_id) {
        res.status(403).send('this page is not for you friend');
        return;
    }
    if (!req.files) {
        res.status(400).send('bad request');
        return;
    }
    const files = req.files;
    try {
        yield db_1.default.removeBook(Number(req.params.book_isbn));
        const { isbn, title, author, subject, language, publisher, description, release_date } = req.body;
        const book = yield db_1.default.addBook(Number(isbn), title, req.session.user_id, String(isbn) + '.pdf', author, description, publisher, subject, language, String(isbn) + '.' + files['cover'][0].originalname.split('.').pop(), release_date);
        res.send(JSON.stringify(book));
    }
    catch (error) {
        console.log(error);
        res.status(400).send('bad request');
    }
}));
app.listen(port, () => {
    console.log(`server listening on port http://127.0.0.1:${port}`);
});
