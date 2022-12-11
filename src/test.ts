function searchBook(isbn?: number, title?: string, author?: string, subject?: string, language?: string, publisher?: string, description?: string, release_date?: string): void {
    if (isbn) {
        console.log(`SELECT book_isbn FROM book WHERE book_isbn = ${isbn}`);
    } else if (title || author || subject || language || publisher || description || release_date) {
        console.log(`SELECT book_isbn FROM book WHERE 
                title LIKE '%${title}%'
                ${(author)?` AND authors LIKE '%${author}%'`:''}
                ${(subject)?` AND subject LIKE '%${subject}%'`:''}
                ${(language)?` AND language LIKE '%${language}%'`:''}
                ${(publisher)?` AND publisher LIKE '%${publisher}%'`:''}
                ${(description)?` AND description LIKE '%${description}%'`:''}
                ${(release_date)?` AND release_date LIKE '%${release_date}%'`:''}
            `);
    } else {
        throw new Error("No search criteria provided.");
    }
}

searchBook(null, "title", "author", "subject", "language", "publisher", "description", "release_date");