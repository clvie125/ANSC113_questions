/* ===========================
   設定：Google Apps Script API
=========================== */
const API_URL = "https://script.google.com/macros/s/AKfycbzA4b-kNA-k5c3bEPjhddJtuGXkTzn57zfLWP4OnrEH9D_08LpkZxnbcyYCt6fV8tEC/exec";

let allQuestions = [];
let selectedQuestions = [];
let dataTable = null;
let editingNo = null;

/* ===========================
   初始化
=========================== */
document.addEventListener("DOMContentLoaded", async () => {
    await loadQuestions();
    initSelect2();
    loadSelectedFromSession();
});

/* ===========================
   讀取題庫 + 轉換格式
=========================== */
async function loadQuestions() {
    const res = await fetch(API_URL + "?action=read");
    const raw = await res.json();

    const headers = raw[0];
    const rows = raw.slice(1);

    allQuestions = rows.map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
    });

    renderTable(allQuestions);
    fillSelectOptions();
}

/* ===========================
   Select2 初始化
=========================== */
function initSelect2() {
    $("#topic-select").select2({ placeholder: "選擇章節", width: "100%" });
    $("#type-select").select2({ placeholder: "選擇題型", width: "100%" });
}

/* ===========================
   填入下拉選單選項
=========================== */
function fillSelectOptions() {
    const topics = [...new Set(allQuestions.map(q => q["Topic"]).filter(x => x))];
    const types = [...new Set(allQuestions.map(q => q["Type_simplify"]).filter(x => x))];

    topics.forEach(t => $("#topic-select").append(new Option(t, t)));
    types.forEach(t => $("#type-select").append(new Option(t, t)));
}

/* ===========================
   按下「篩選」才更新表格
=========================== */
function applyFilter() {
    const selectedTopics = $("#topic-select").val() || [];
    const selectedTypes = $("#type-select").val() || [];

    let filtered = allQuestions;

    if (selectedTopics.length > 0) {
        filtered = filtered.filter(q => selectedTopics.includes(q["Topic"]));
    }

    if (selectedTypes.length > 0) {
        filtered = filtered.filter(q => selectedTypes.includes(q["Type_simplify"]));
    }

    renderTable(filtered);
}

/* ===========================
   渲染題目表格（已修正 DataTable 不更新問題）
=========================== */
function renderTable(list) {
    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";

    list.forEach(q => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><input type="checkbox" class="row-check" data-no="${q["NO."]}"></td>
            <td>${q["NO."]}</td>
            <td>${q["Question"]}</td>
            <td>${q["Type"]}</td>
            <td>${q["Type_simplify"]}</td>
            <td>${q["Answer"]}</td>
            <td>${q["Topic"]}</td>
            <td>${q["Picture No."] || ""}</td>
            <td>${q["Add Date"] || ""}</td>
            <td><button onclick="openEditModal('${q["NO."]}')">修改</button></td>
        `;

        tbody.appendChild(tr);
    });

    if (dataTable) {
        dataTable.destroy();
    }

    dataTable = new DataTable("#questionTable", {
        destroy: true,
        autoWidth: false
    });
}

/* ===========================
   加入題目
=========================== */
function addSelectedQuestions() {
    const checks = document.querySelectorAll(".row-check:checked");

    checks.forEach(chk => {
        const no = chk.dataset.no;
        const q = allQuestions.find(x => x["NO."] == no);

        if (q && !selectedQuestions.some(x => x["NO."] == no)) {
            selectedQuestions.push(q);
        }
    });

    sessionStorage.setItem("selectedQuestions", JSON.stringify(selectedQuestions));
    alert("已加入題目！");
}

/* ===========================
   查看所選題目
=========================== */
function openSelectedModal() {
    const listDiv = document.getElementById("selected-list");

    if (selectedQuestions.length === 0) {
        listDiv.innerHTML = "<p>尚未加入任何題目</p>";
    } else {
        listDiv.innerHTML = selectedQuestions
            .map(q => `<p>${q["NO."]}. ${q["Question"]}</p>`)
            .join("");
    }

    document.getElementById("selected-modal").style.display = "block";
}

function closeSelectedModal() {
    document.getElementById("selected-modal").style.display = "none";
}

/* ===========================
   匯出 Word
=========================== */
async function exportWord() {
    if (selectedQuestions.length === 0) {
        alert("沒有題目可匯出！");
        return;
    }

    let tf = selectedQuestions.filter(q => q["Type_simplify"] === "True / False");
    let mc = selectedQuestions.filter(q => q["Type_simplify"] === "Multiple choices");
    let match = selectedQuestions.filter(q => q["Type_simplify"] === "Match");

    const doc = new docx.Document();

    function addSection(title, list) {
        if (list.length === 0) return;
        doc.addSection({
            children: [
                new docx.Paragraph({ text: title, heading: docx.HeadingLevel.HEADING_1 }),
                ...list.map(q => new docx.Paragraph(`${q["NO."]}. ${q["Question"]}`))
            ]
        });
    }

    addSection("True / False", tf);
    addSection("Multiple Choice", mc);
    addSection("Match", match);

    doc.addSection({
        children: [
            new docx.Paragraph({ text: "答案", heading: docx.HeadingLevel.HEADING_1 }),
            ...selectedQuestions.map(q => new docx.Paragraph(`${q["NO."]}: ${q["Answer"]}`))
        ]
    });

    docx.Packer.toBlob(doc).then(blob => saveAs(blob, "題庫.docx"));
}

/* ===========================
   修改題目
=========================== */
function openEditModal(no) {
    editingNo = no;
    const q = allQuestions.find(x => x["NO."] == no);
    if (!q) return;

    const form = `
        <label>Question</label>
        <textarea id="edit-question" style="width:100%; height:80px;">${q["Question"]}</textarea>

        <label>Answer</label>
        <input id="edit-answer" value="${q["Answer"]}" style="width:100%;">

        <label>Topic</label>
        <input id="edit-topic" value="${q["Topic"]}" style="width:100%;">

        <label>Type</label>
        <input id="edit-type" value="${q["Type"]}" style="width:100%;">

        <label>Type_simplify</label>
        <input id="edit-type-s" value="${q["Type_simplify"]}" style="width:100%;">
    `;

    document.getElementById("edit-form").innerHTML = form;
    document.getElementById("edit-modal").style.display = "block";
}

function closeEditModal() {
    document.getElementById("edit-modal").style.display = "none";
}

/* ===========================
   儲存修改
=========================== */
async function saveEdit() {
    const data = {
        no: editingNo,
        question: document.getElementById("edit-question").value,
        answer: document.getElementById("edit-answer").value,
        topic: document.getElementById("edit-topic").value,
        type: document.getElementById("edit-type").value,
        type_s: document.getElementById("edit-type-s").value
    };

    await fetch(API_URL + "?action=update", {
        method: "POST",
        body: JSON.stringify(data)
    });

    alert("修改完成！");
    closeEditModal();
    loadQuestions();
}
