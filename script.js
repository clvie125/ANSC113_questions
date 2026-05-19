const API_URL = "https://script.google.com/macros/s/AKfycbzA4b-kNA-k5c3bEPjhddJtuGXkTzn57zfLWP4OnrEH9D_08LpkZxnbcyYCt6fV8tEC/exec";

// 讀取題庫
async function loadQuestions() {
    const res = await fetch(API_URL);
    const data = await res.json();

    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = row[i] || "");
        return obj;
    });
}

// 題庫表格呈現
async function renderQuestionsTable() {
    const questions = await loadQuestions();
    const tbody = document.getElementById("table-body");

    tbody.innerHTML = questions.map((q, i) => `
        <tr data-row="${i + 2}">
            <td><input type="checkbox" class="row-check"></td>
            <td contenteditable="true">${q["NO."]}</td>
            <td contenteditable="true">${q.Question}</td>
            <td contenteditable="true">${q.Type}</td>
            <td contenteditable="true">${q.Type_simplify}</td>
            <td contenteditable="true">${q.Answer}</td>
            <td contenteditable="true">${q.Topic}</td>
            <td contenteditable="true">${q["Picture No."]}</td>
            <td contenteditable="true">${q["Add Date"]}</td>
        </tr>
    `).join("");

    new DataTable("#questionTable");
}

// 儲存修改
async function saveEdits() {
    const rows = document.querySelectorAll("#questionTable tbody tr");

    for (let tr of rows) {
        const checked = tr.querySelector(".row-check").checked;
        if (!checked) continue;

        const rowNumber = tr.dataset.row;
        const values = [...tr.children].slice(1).map(td => td.innerText);

        await fetch(API_URL + "?action=update", {
            method: "POST",
            body: JSON.stringify({
                row: Number(rowNumber),
                values: values
            })
        });
    }

    alert("已儲存修改！");
}

// export WORD
async function exportWord() {
    const rows = document.querySelectorAll("#questionTable tbody tr");
    let selected = [];

    rows.forEach(tr => {
        if (tr.querySelector(".row-check").checked) {
            const tds = tr.querySelectorAll("td");
            selected.push({
                no: tds[1].innerText,
                question: tds[2].innerText,
                type: tds[3].innerText,
                type_s: tds[4].innerText,
                answer: tds[5].innerText
            });
        }
    });

    if (selected.length === 0) {
        alert("請先勾選題目！");
        return;
    }

    // 分類
    let tf = selected.filter(q => q.type_s === "True / False");
    let mc = selected.filter(q => q.type_s === "Multiple choices");
    let match = selected.filter(q => q.type_s === "Match");

    // 隨機排序
    tf.sort(() => Math.random() - 0.5);
    mc.sort(() => Math.random() - 0.5);
    match.sort(() => Math.random() - 0.5);

    // Word 文件
    const doc = new docx.Document();

    function addSection(title, list) {
        doc.addSection({
            children: [
                new docx.Paragraph({
                    text: title,
                    heading: docx.HeadingLevel.HEADING_1
                }),
                ...list.map(q =>
                    new docx.Paragraph(`${q.no}. ${q.question}`)
                )
            ]
        });
    }

    addSection("True / False", tf);
    addSection("Multiple Choice", mc);
    addSection("Match", match);

    // 最後一頁答案
    doc.addSection({
        children: [
            new docx.Paragraph({
                text: "答案",
                heading: docx.HeadingLevel.HEADING_1
            }),
            ...selected.map(q =>
                new docx.Paragraph(`${q.no}: ${q.answer}`)
            )
        ]
    });

    // 下載 Word
    docx.Packer.toBlob(doc).then(blob => {
        saveAs(blob, "題庫.docx");
    });
}


// 啟動表格
if (document.getElementById("questionTable")) {
    renderQuestionsTable();
}
