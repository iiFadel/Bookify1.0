// fetch comments from the server
async function showComments(id){
    const response = await fetch(`//${id}/comments`, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json; charset=UTF-8'
        }
    });
    if(response.ok){
        const responseJson = await response.json();
        console.log(responseJson);
        const container = document.getElementById("commentContainer");
        container.innerHTML = '';
        responseJson.forEach(comment => {
            container.innerHTML += `
                <div class="comment">
                    <p>${comment.comment}</p>
                    <p>-${comment.author}</p>
                </div>`
        });
    }
}

// add the see comments button event handler
async function seeComments(id){
    console.log(id);
    const comments = document.getElementById('comments')
    comments.style.display = 'block';
    await showComments(id);
}

// send a comment to the server
async function sendComment(id){
    const formElement = document.getElementById("commentForm");
    const author = formElement.name.value;
    const comment = formElement.commentText.value;
    const response = await fetch(`/us/${id}/comments`, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({author: author, commentText: comment})
    });
    if(response.ok){
        formElement.name.value = '';
        formElement.commentText.value = '';
        await showComments(id);
    }
}
