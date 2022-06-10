const btns = document.querySelectorAll('.book-toggle');  // Returns a node list of that selector 
btns.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.parentNode.classList.toggle('active');
    })
})
