<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ごはんGPT - 自炊特化</title>
  <style>
    body {
      background-color: #fdf6ef;
      font-family: "Hiragino Kaku Gothic ProN", sans-serif;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    }
    h1 {
      text-align: center;
      font-size: 1.8em;
      color: #2f4f4f;
      margin-bottom: 4px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 6px;
      font-weight: bold;
      font-size: 1em;
    }
    .required-label::after {
      content: " *";
      color: red;
    }
    select,
    input[type="text"],
    input[type="number"] {
      width: 100%;
      box-sizing: border-box;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #ccc;
      font-size: 1em;
    }
    .checkbox-inline,
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .toggle-section {
      display: none;
      margin-top: 8px;
    }
    button {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 12px;
      background-color: #2f4f4f;
      color: white;
      font-size: 1em;
      cursor: pointer;
      margin-top: 20px;
    }
    .toggle-button {
      background: none;
      border: none;
      color: #2f4f4f;
      font-weight: bold;
      cursor: pointer;
      margin-bottom: 10px;
    }
    .section-divider {
      border-top: 1px solid #aaa;
      margin: 30px 0 20px;
    }
    .note {
      font-size: 0.85em;
      color: #999;
      text-align: right;
      margin-top: 16px;
    }
    .optional-heading {
      margin-top: 12px;
      font-weight: bold;
      font-size: 1.1em;
      color: #2f4f4f;
    }
    .intro {
      font-size: 0.95em;
      color: #555;
      margin: 0 0 28px;
      line-height: 1.6;
      text-align: center;
    }
    @media screen and (max-width: 480px) {
      .container {
        border-radius: 0;
        margin: 0;
        padding: 16px;
      }
      h1 {
        font-size: 1.5em;
      }
      button {
        padding: 12px;
        font-size: 0.95em;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 style="margin-bottom: 24px;">ごはんGPT</h1>
    <p class="intro">
      ごはんGPTは、「おなかがすいた！」と思ったときに、<br>気分や予算に応じてすぐに自炊メニューを提案してくれるアプリです。
    </p>
    <form id="menuForm">
      <p class="optional-heading">メニューを提案するために必要な情報を教えてください！</p>
      <!-- フォーム入力項目省略（元のまま） -->
      <button type="submit">メニューを提案する</button>
    </form>
    <p id="loading" style="display:none; color:#2f4f4f; font-weight:bold;">メニューを提案中です…</p>
    <pre id="result" style="white-space:pre-wrap; background:#f9f9f9; padding:10px; border-radius:8px; margin-top:10px;"></pre>
    <p class="note">※ <span style="color:red">*</span> は必須項目です</p>
  </div>
  <script>
    function toggleAllergyInput() {
      const checkbox = document.getElementById('hasAllergy');
      const inputField = document.getElementById('allergyInput');
      inputField.style.display = checkbox.checked ? 'block' : 'none';
    }
    function toggleDetails() {
      const details = document.getElementById('detailsArea');
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
    document.getElementById('menuForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const loadingEl = document.getElementById('loading');
      const resultEl = document.getElementById('result');
      loadingEl.style.display = 'block';
      resultEl.textContent = '';
      const formData = new FormData(e.target);
      const body = Object.fromEntries(formData.entries());
      body.tools = formData.getAll('tools');
      try {
        const res = await fetch('/api/gpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        loadingEl.style.display = 'none';
        if (!data.result || data.result.trim() === '') {
          resultEl.textContent = 'メニューの提案が生成されませんでした。条件を見直してください。';
        } else {
          resultEl.textContent = data.result;
        }
      } catch (err) {
        loadingEl.style.display = 'none';
        resultEl.textContent = 'エラーが発生しました。';
      }
    });
  </script>
</body>
</html>
