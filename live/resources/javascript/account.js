let attemptingLogin = false
let attemptingRegister = false
let oldRating = [0, 0]
let oldPlayers = ['', '']
let username;
let ownRating;

function login() {
    if (!attemptingLogin) {
        attemptingLogin = true
        sendToWs('login', [
            ['username', $('#username-input').val()],
            ['password', $('#password-input').val()]
        ])
    }
}

function logout() {
    if (getCookie("token") !== "") {
        sendToWs('logout', [
            ['userId', getCookie("token").split('|')[1]]
        ])
    }
    deleteCookie("token")
}

function register() {
    if (!attemptingRegister) {
        if ($('#password-register-verify').val() === $('#password-register').val()) {
            attemptingRegister = true
            sendToWs('register', [
                ['username', $('#username-register').val()],
                ['password', $('#password-register').val()]
            ])
        } else {
            $('#register-error').text('Passwords do not match')
        }
    }
}

function checkForToken() {
    let token = getCookie("token");
    if (token !== "") {
        token = token.split('|')
        console.log(token)
        sendToWs("token", [
            ['token', token[0]],
            ['userId', token[1]]
        ])
    }
}

var ownUserId = 0
var adminUserIds = [1]

function loginSuccess(data) {
    ownUserId = data.userId
    if (data.hasOwnProperty("token")) {
        setCookie("token", data.token + "|" + data.userId, 7)
    }
    mode = "home"
    $("#login-wrapper").hide()
    $('#account-username').html(data.username + "<span id=\"account-rating\">" + Math.round(data.rating) + "</span>")
    ownRating = data.rating
    $('#join-date').text("Joined " + formatDate(data.signUp))
    username = data.username
    $("#home").show()
}