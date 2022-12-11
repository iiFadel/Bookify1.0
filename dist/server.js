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
const db_1 = __importDefault(require("./db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
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
// root
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.username) {
        res.render('index.html'); // render logged in version
    }
    else {
        res.render('index.html'); // render logged out version
    }
}));
// register
app.get('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.username) {
        console.log(req.session);
        res.redirect('/');
    }
    else {
        console.log(req.session);
        res.send('register.html');
    }
}));
app.post('/register', (0, validation_1.validate)([validation_1.newUsernameSchema, validation_1.newPasswordSchema, validation_1.emailSchema]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, email } = req.body;
    // check if user already exists
    const userExists = yield db_1.default.getUser(username);
    const emailExists = yield db_1.default.getUserByEmail(email);
    if (userExists || emailExists) {
        res.status(400).send('User already exists');
    }
    else {
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const user = yield db_1.default.addUser(username, hashedPassword, email);
        res.send(JSON.stringify(user));
        res.redirect('/login');
    }
}));
// login
app.get('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.username) {
        res.redirect('/');
    }
    else {
        res.send('login.html');
    }
}));
app.post('/login', validation_1.sanitizePassword, validation_1.sanitizeUsername, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user = yield db_1.default.getUser(username);
    if (user) {
        const match = yield bcrypt_1.default.compare(password, user.password);
        if (match) {
            res.redirect('/');
            // initialize session
            req.session.username = user.username;
            req.session.user_id = user.user_id;
        }
        else {
            res.status(400).send('Password does not match');
        }
    }
    else {
        res.status(400).send('User does not exist');
    }
}));
// get reviews about a book
app.get('/book/:book_isbn/reviews', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const book_isbn = Number(req.params.book_isbn);
    const reviews = yield db_1.default.getReviews(book_isbn);
    res.send(JSON.stringify(reviews));
}));
// add a review about a book
app.post('/book/:book_isbn/reviews', (0, validation_1.validate)([validation_1.commentSchema]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // check if user is logged in
    if (req.session.user_id) {
        const book_isbn = Number(req.params.book_isbn);
        const comment = req.body.comment;
        const rating = Number(req.body.rating);
        const user_id = req.session.user_id;
        const review = yield db_1.default.addReview(user_id, book_isbn, comment, rating);
        res.send(JSON.stringify(review));
    }
    else {
        res.redirect('/login');
    }
}));
// TODO routes 
// get book page
app.get('/book/:book_isbn', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const book_isbn = Number(req.params.book_isbn);
    const book = yield db_1.default.getBooks([book_isbn]);
    res.render('book.html', book);
}));
// get saved books page
app.get('/saved', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.user_id) {
        const user_id = Number(req.session.user_id);
        const books = yield db_1.default.getSavedBooks(user_id); //get the book isbn's 
        const bookInfo = yield db_1.default.getBooks(books); // get the book infos
        res.render('saved.html', { bookInfo });
    }
}));
// search for books
app.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let searchRequest = req.query;
    const isbns = yield db_1.default.searchBook(searchRequest.isbn, searchRequest.title, searchRequest.author, searchRequest.subject, searchRequest.language, searchRequest.publisher, searchRequest.description, searchRequest.release_date);
    const books = yield db_1.default.getBooks(isbns);
    res.render('search.html', { books });
}));
app.listen(port, () => {
    console.log(`server listening on port http://127.0.0.1:${port}`);
});
