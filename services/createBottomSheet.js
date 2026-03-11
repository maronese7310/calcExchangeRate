import { rates } from "../assets/data/rates";

function createBottomSheet() {
    const addButton = document.getElementById('add-button');
    const bottomSheet = document.getElementById('bottom-sheet');

    addButton.addEventListener('click', () => {
        bottomSheet.hidden = false;
    });
}