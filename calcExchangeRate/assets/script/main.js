document.addEventListener("DOMContentLoaded", () => {

    const startScreen = document.getElementById("start-screen")
    const mainScreen = document.getElementById("main-screen")

    function showMainScreen() {

        startScreen.classList.add("hidden")
        mainScreen.classList.remove("hidden")

        console.log("done")
    }

    /* テスト用 */
    setTimeout(showMainScreen, 1000)

})