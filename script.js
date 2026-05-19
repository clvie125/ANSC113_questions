const API_KEY = "AIzaSyAfTLC1Eb0muS0-gn6asmINPXXrnvarxLk";
const SHEET_ID = "1BZQBpuLph2CbMq6E0pT8aSgvsw12SoA680ybO6-H1_0";
const RANGE = "題庫!A:H"; // 你的題庫範圍

async function loadQuestions() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    const rows = data.values;
    const headers = rows[0];
    const questions = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = row[i] || "");
        return obj;
    });

    return questions;
}
