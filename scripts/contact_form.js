
// REference contactInfor collections
let contactInfo = firebase.database().ref("infos");

// Listen for a a submit
document.querySelector(".contact-form").addEventListener("submit", submitForm);

function submitForm(e) {
    e.preventDefault();
    
    // Get input values
    let name = document.querySelector(".name").value;
    let email = document.querySelector(".email").value;
    let message = document.querySelector(".message").value;
    console.log(name, email, message);

    saveContactInfo(name, email, message);
}

// Save infos to Firebase
function savecontactInfo(name, email, message) {
    let newContactInfo = contactInfo.push();

    newContactInfo.set({
        name: name,
        email: email,
        message: message,
    });
}