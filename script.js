const API_URL = "https://script.google.com/macros/s/AKfycbw3OslMpIhzquDfiXWuz9CBPjW0tUZmkfnDIy149Bjomsh4dKkgYVP8LM2oJ-eSq6zK/exec";

// 讀取題庫
async function loadQuestions() {
    const res = await fetch(API_URL);
    const data = await res.json();   // data = 2D array

    const headers = data[0];         // 第一列：表頭
    const rows = data.slice(1);      // 其他列：資料

    // 轉成物件格式
    return rows.map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = row[i] || "");
        return obj;
    });
}

// 顯示題庫
async function renderQuestions() {
    const list = document.getElementById("question-list");
    const questions = await loadQuestions();

    list.innerHTML = questions.map((q, i) => `
        <div style="margin-bottom:10px;">
            <b>${q["NO."]}</b> — ${q.Question}
        </div>
    `).join("");
}

// 新增題目（POST 到 GAS）
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

// 頁面載入時顯示題庫
renderQuestions();
