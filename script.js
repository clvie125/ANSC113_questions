const API_KEY = "AIzaSyAfTLC1Eb0muS0-gn6asmINPXXrnvarxLk";
const SHEET_ID = "1BZQBpuLph2CbMq6E0pT8aSgvsw12SoA680ybO6-H1_0";
const RANGE = "Sheet1!A:H"; // 你的題庫範圍

// 讀取題庫
async function loadQuestions() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    const rows = data.values;
    const headers = rows[0];

    return rows.slice(1).map(row => {
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
            <button onclick="deleteQuestion(${i})">刪除</button>
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
    const no = document.getElementById("q_no").value;
    const question = document.getElementById("q_question").value;
    const type = document.getElementById("q_type").value;
    const type_s = document.getElementById("q_type_s").value;
    const answer = document.getElementById("q_answer").value;
    const topic = document.getElementById("q_topic").value;
    const pic = document.getElementById("q_pic").value;
    const date = document.getElementById("q_date").value;

    const questions = await loadQuestions();

    const headers = ["NO.", "Question", "Type", "Type_simplify", "Answer", "Topic", "Picture No.", "Add Date"];

    const updated = [
        headers,
        ...questions.map(q => [
            q["NO."], q.Question, q.Type, q.Type_simplify,
            q.Answer, q.Topic, q["Picture No."], q["Add Date"]
        ]),
        [no, question, type, type_s, answer, topic, pic, date]
    ];

    await saveQuestions(updated);
}

// 刪除題目
async function deleteQuestion(index) {
    const questions = await loadQuestions();

    questions.splice(index, 1);

    const headers = ["NO.", "Question", "Type", "Type_simplify", "Answer", "Topic", "Picture No.", "Add Date"];

    const updated = [
        headers,
        ...questions.map(q => [
            q["NO."], q.Question, q.Type, q.Type_simplify,
            q.Answer, q.Topic, q["Picture No."], q["Add Date"]
        ])
    ];

    await saveQuestions(updated);
}

// 頁面載入時顯示題目
renderQuestions();

