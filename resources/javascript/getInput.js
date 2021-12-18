// Deal with keyboard input
window.addEventListener("keydown", function (event) {
    if (mode === "login") {
        if (event.key === "Enter") {
            console.log("Enter Pressed")
            login()
        }
    }
    else if (mode === "register") {
        if (event.key === "Enter") {
            console.log("Enter Pressed")
            register()
        }
    }
}, true);