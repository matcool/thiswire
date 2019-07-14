document.getElementById('login').onclick = () => {
    let name = document.getElementById('name').value;
    if (name != '') {
        localStorage.setItem('name', name);
        window.location.href = '../';
    }
};