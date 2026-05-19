const API_URL = "https://script.google.com/macros/s/AKfycbw3OslMpIhzquDfiXWuz9CBPjW0tUZmkfnDIy149Bjomsh4dKkgYVP8LM2oJ-eSq6zK/exec";

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


// 顯示題目
async function renderQuestions() {
    const list = document.getElementById("question-list");
    const questions = await loadQuestions();

    list.innerHTML = questions.map((q, i) => `
        <div style="margin-bottom:10px;">
            <b>${q["NO."]}</b> — ${q.Question}
        </div>
    `).join("");
}

// 寫回 Google Sheet
async function saveQuestions(updatedRows) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?valueInputOption=RAW&key=${API_KEY}`;

    await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: updatedRows })
    });

    alert("已儲存！");
    renderQuestions();
}

// 新增題目
async function addQuestion() {
    const body = [
        document.getElementById("q_no").value,
        document.getElementById("q_question").value,
        document.getElementById("q_type").value,
        document.getElementById("q_type_s").value,
        document.getElementById("q_answer").value,
        document.getElementById("q_topic").value,
        document.getElementById("q_pic").value,
        document.getElementById("q_date").value
    ];

    await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(body)
    });

    alert("新增成功！");
    renderQuestions();
}

// 頁面載入時顯示題目
renderQuestions();

