let totalPages = 2;

for (let btn of document.querySelectorAll('.switchButton')) {
    btn.addEventListener("click", () => {
        switchPage(btn.dataset.pageIndex);
    })
}

let switchPage = (pageIndex) => {
    for (let i = 0; i < totalPages; i++) {
        if (i === +pageIndex) {
            document.querySelector(`.pageContainer[data-page-index="${pageIndex}"]`).style.display = "block";
            document.querySelector(`.switchButton[data-page-index="${i}"]`).setAttribute("disabled", true);
        } else {
            document.querySelector(`.switchButton[data-page-index="${i}"]`).removeAttribute("disabled");
            document.querySelector(`.pageContainer[data-page-index="${i}"]`).style.display = "none";
        }
    }
}

switchPage(1);