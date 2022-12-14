import { newUsernameSchema, newPasswordSchema, emailSchema, commentSchema, sanitizePassword, sanitizeUsername, validate } from './validation';
import session from 'express-session';
import nunjucks from 'nunjucks';
import multer from 'multer';
import db from './db';
import bcrypt from 'bcrypt';
import express, { Express, Response, Request } from 'express';
const app: Express = express();
const port = 3000;


// configure nunjucks templates
nunjucks.configure('views', { express: app, autoescape: true });

// middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(session({
    secret: '89u7564hr4yt6bv43nejc46dwsx', // * I dont know why we need a secret it's not like we're deploying this
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));

declare module 'express-session' {
    export interface SessionData {
        username: string;
        user_id: number;
        admin: boolean;
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/' + file.fieldname);
    },
    filename: function (req, file, cb) {
        cb(null, req.body.isbn + '.' + file.originalname.split('.').pop());
    }
});
const upload = multer({ storage: storage })


//**** ROUTES ****//
// root
app.get('/', async (req: Request, res: Response) => {
    if (req.session?.admin) {
        res.render('index.html', { signedIn: true, username: req.session.username, admin:true }); // render admin version
    } else if (req.session?.username) {
        res.render('index.html', { signedIn: true, username: req.session.username, admin:false }); // render logged in version
    } else {
        res.render('index.html', { signedIn: false}); // render logged out version
    }
});

//** login/register **//
// register
app.get('/register', async (req: Request, res: Response) => {
    if (req.session?.username) {
        res.redirect('/');
    } else {
        res.render('register.html');
    }
});

app.post('/register', validate([newUsernameSchema, newPasswordSchema, emailSchema]), async (req: Request, res: Response) => {
    const { username, password, email } = req.body;
    console.log(req.body);
    
    // check if user already exists
    const userExists = await db.getUser(username);
    const emailExists = await db.getUserByEmail(email);
    if (userExists) {
        res.status(400).render('register.html', { errors: [{msg:'Username already in use'}], username: username, email: email });
    } else if (emailExists){
        res.status(400).render('register.html', { errors: [{msg:'Email already in use'}], username: username, email: email });
    } else {
        const hashedPassword = password //await bcrypt.hash(password, 10);
        await db.addUser(username, hashedPassword, email);
        // ? pop up message saying account created
        res.redirect('/login');
    }
});

// login
app.get('/login', async (req: Request, res: Response) => {
    if (req.session?.username) {
        res.redirect('/');
    } else {
        res.render('login.html');
    }
});

app.post('/login', sanitizePassword, sanitizeUsername, async (req: Request, res: Response) => {
    if (req.session?.username) {
        res.redirect('/');
        return;
    }
    const { username, password } = req.body;
    // check if user exists
    const user = await db.getUser(username);
    
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
    const admin = await db.getAdmin(username);
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
    
});

// logout
app.get('/logout', async (req: Request, res: Response) => {
    if (!req.session?.username) {
        res.redirect('/');
        return;
    }
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});

//** Books **//
// get book page
app.get('/book/:book_isbn', async (req: Request, res: Response) => {
    const book_isbn = Number(req.params.book_isbn);
    const book = await db.getBooks([book_isbn]);
    res.render('bookPage.html', book[0]);
});

// get saved books page
app.get('/bookmarks', async (req: Request, res: Response) => {
    if (req.session?.admin) {
        res.status(403).send('Admins cannot have saved books');
        return;
    }
    if (!req.session?.user_id) {
        res.redirect('/login');
        return;
    }    
    const user_id = Number(req.session.user_id);
    const books = await db.getSavedBooks(user_id); //get the book isbn's 
    const bookInfo = await db.getBooks(books); // get the book infos
    res.render('bookmark.html', { books: bookInfo, username: req.session.username, admin:req.session.admin});

});

// read a book
app.get('/book/:book_isbn/read', async (req: Request, res: Response) => {
    const book_isbn = Number(req.params.book_isbn);
    const book = await db.getBooks([book_isbn]);
    res.render('read-book.html', book[0]);
});

// get reviews about a book
app.get('/book/:book_isbn/reviews', async (req: Request, res: Response) => {
    const book_isbn = Number(req.params.book_isbn);
    const reviews = await db.getReviews(book_isbn);
    res.send(JSON.stringify(reviews));
});

// save a book
app.post('/book/:book_isbn/save', async (req: Request, res: Response) => { 
    if (req.session?.admin) {
        res.status(403).send('Admins cannot save books');
        return;
    }
    if (!req.session?.user_id) {
        res.redirect('/login');
        return;
    }
    const book_isbn = Number(req.params.book_isbn);
    const user_id = req.session.user_id as number;

    const saved = await db.addSavedBook(user_id, book_isbn);
    res.render('success.html', {operation:"Book saved Successfully"});
});

// add a review about a book
app.post('/book/:book_isbn/reviews', validate([commentSchema]), async (req: Request, res: Response) => {
    // dont accept reviews from admins
    if (req.session?.admin) {
        res.status(403).send('Admins cannot review books');
        return;
    }
    // check if user is logged in
    if (!req.session?.user_id) {
        res.redirect('/login');
        return;
    }
    const book_isbn = Number(req.params.book_isbn);
    const comment = req.body.comment;
    const rating = Number(req.body.rating);
    const user_id = req.session.user_id as number;
    const review = await db.addReview(user_id, book_isbn, comment, rating);
    res.send(JSON.stringify(review));
});

// reading view of a book
// just send pdf file and let the browser handle it
app.get('/book/:book_isbn/reading', async (req: Request, res: Response) => {
    // todo add a reading page
    const book_isbn = Number(req.params.book_isbn);
    const book = await db.getBooks([book_isbn]);
    res.redirect('/pdf/' + book[0].pdf);
});

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
app.post('/search', async (req: Request, res: Response) => {
    const searchTerm = req.body.term;
    if (searchTerm) {
        console.log(searchTerm);
        const isbns = await db.searchBookByTerm(searchTerm);
        let arr : number[] = [];
        for (let i = 0; i < isbns.length; i++) {
            arr.push(isbns[i].book_isbn);
        }
        const books = await db.getBooks(arr);
        res.render('search.html', {term:searchTerm, books: books, username: req.session?.username, admin:req.session?.admin });
    } else {
        res.status(400).send('Bad request');
    }
});


//** Requests **//
// book request form
app.get('/request', async (req: Request, res: Response) => {
    if (req.session?.admin) {
        res.status(403).send('Admins cannot request books');
        return;
    }
    if (!req.session?.user_id) {
        res.redirect('/login');
        return;
    }
    res.render('request.html',{username: req.session.username, admin:req.session.admin});
}); 

// post book request form
// form should include title and a short letter
app.post('/request', async (req: Request, res: Response) => {
    if (req.session?.admin) {
        res.status(403).send('Admins cannot request books');
        return;
    } else if (!req.session?.user_id) {
        res.redirect('/login');
        return;
    }
    const { title, isbn } = req.body;
    const author = req.body.author;
    const user_id = Number(req.session.user_id);
    const request = await db.addRequest(user_id, title, isbn, author);
    res.redirect('/');

});

// admin view all requests
app.get('/requests', async (req: Request, res: Response) => {
    if (!req.session.admin) {
        res.status(403).send('this page is not for you friend');
        return;
    }
    const requests = await db.getRequests(req.body.status);
    res.render('view-request.html', { requests, username: req.session.username, admin:req.session.admin});
});

// admin update a request
// include status and request_id in the body
app.put('/requests', async (req: Request, res: Response) => {
    if (!req.session.admin || !req.session.user_id) {
        res.status(403).send('this page is not for you friend');
        return;
    }
    try {
        const request_id = Number(req.body.request_id);
        const status = req.body.status as string;
        const request = await db.updateRequestStatus(request_id, status, req.session.user_id);
        res.send(JSON.stringify(request));
    } catch (error) {
        res.status(400).send('bad request');
        console.log(error);
    }
});

//** Admin add/update book **//
// admin add book form
app.get('/addbook', async (req: Request, res: Response) => {
    if (!req.session.admin) {
        res.status(403).send('this page is not for you friend');
        return;
    }
    res.render('addBook.html', { username: req.session.username, admin:req.session.admin });
});

// admin add book
// Don't forget the enctype="multipart/form-data" in your form https://www.npmjs.com/package/multer
// the field name for the pdf file and the image MUST be "pdf" and "cover" respectively
app.post('/addbook', upload.fields([{ name: 'pdf' }, { name: 'cover' }]), async (req: Request, res: Response) => {
    if (!req.session?.admin) {
        res.status(403).send('this page is not for you friend');
        return;
    }
    if (!req.files) {
        res.status(400).send('bad request');
        return;
    }
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    console.log(req.session.user_id);

    try {
        const { isbn, title, authors, subject, language, publisher, description, release_date } = req.body;
        const book = await db.addBook(Number(isbn), title, req.session.user_id as number, String(isbn) + '.pdf', authors, description, publisher, subject, language, String(isbn) + '.' + files['cover'][0].originalname.split('.').pop(), release_date);
        res.render('success.html', {operation:"Book added Successfully", canagain:true, again:"/addbook", }); //? maybe add a page that tells the admin that the book has been added?
    } catch (error) {
        console.log(error);
        res.status(400).send('bad request');
    }

});

// admin update book form
app.get('/updatebook/:book_isbn', async (req: Request, res: Response) => {
    if (!req.session.admin || !req.session.user_id) {
        res.status(403).send('this page is not for you friend');
        return;
    }
    const book = await db.getBooks([Number(req.params.book_isbn)]);
    res.render('addBook.html', book[0]);
});

// admin update book
// Don't forget the enctype="multipart/form-data" in your form https://www.npmjs.com/package/multer
// the field name for the pdf file and the image MUST be "pdf" and "cover" respectively
app.put('/updatebook/:book_isbn', upload.fields([{ name: 'pdf' }, { name: 'cover' }]), async (req: Request, res: Response) => {
    if (!req.session.admin || !req.session.user_id) {
        res.status(403).send('this page is not for you friend');
        return;
    }
    if (!req.files) {
        res.status(400).send('bad request');
        return;
    }
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    try {
        await db.removeBook(Number(req.params.book_isbn));
        const { isbn, title, author, subject, language, publisher, description, release_date } = req.body;
        const book = await db.addBook(Number(isbn), title, req.session.user_id, String(isbn) + '.pdf', author, description, publisher, subject, language, String(isbn) + '.' + files['cover'][0].originalname.split('.').pop(), release_date);
        res.send(JSON.stringify(book));
    } catch (error) {
        console.log(error);
        res.status(400).send('bad request');
    }
});


app.listen(port, () => {
    console.log(`server listening on port http://127.0.0.1:${port}`);
});
