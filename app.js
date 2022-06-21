const toggle = document.querySelectorAll('.book-toggle');  // Returns a node list of that selector 
toggle.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.parentNode.classList.toggle('active');
    })
})

