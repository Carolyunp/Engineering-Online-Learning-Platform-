
document.addEventListener('DOMContentLoaded', function() {
    // Function to load navbar
    function loadNavbar() {
        const nav = document.createElement('nav');
        nav.innerHTML = `
            <ul class="sideBar">
                <i class="fa-solid fa-xmark fa-lg" style="color: #fff" onclick="closeSideBar()" id="cross"></i>
                <li><a href="index.html">HOME</a></li>
                <li><a href="about.html">ABOUT</a></li>
                <li><a href="https://moodle.ucl.ac.uk/mod/forum/view.php?id=5555392" target="_blank">FORUM</a></li>
                <li><a href="contact.html">CONTACT</a></li>
            </ul>
            <ul class="navBar">
                <li><a href="index.html">HOME</a></li>
                <li><a href="about.html">ABOUT</a></li>
                <li><a href="https://moodle.ucl.ac.uk/mod/forum/view.php?id=5555392" target="_blank">FORUM</a></li>
                <li><a href="contact.html">CONTACT</a></li>
                <i class="fa-solid fa-bars fa-lg" style="color: #fff" onclick="showSideBar()" id="bar"></i>
            </ul>
            <input id="backBTN" type="button" value="&larr;" onclick="history.back()"/> 
        `;
        document.body.prepend(nav);
    }

    // Function to show sidebar
    function showSideBar() {
        const sideBar = document.querySelector('.sideBar');
        const bar = document.getElementById('bar');
        sideBar.style.display = 'flex';
        bar.style.display = 'none';
    }

    // Function to close sidebar
    function closeSideBar() {
        const sideBar = document.querySelector('.sideBar');
        const bar = document.getElementById('bar');
        sideBar.style.display = 'none';
        bar.style.display = 'flex';
    }

    // Call loadNavbar function when the page loads
    loadNavbar();

    // Event listener for the bar icon
    const bar = document.getElementById('bar');
    bar.addEventListener('click', showSideBar);

    // Event listener for the cross icon
    const cross = document.getElementById('cross');
    cross.addEventListener('click', closeSideBar);
});
