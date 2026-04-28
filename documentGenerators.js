const DocumentGenerators = (() => {

  // =========================
  // SINGLE SOURCE OF TRUTH
  // =========================
  const SUBJECTS = [
    "bangla",
    "english",
    "math",
    "science",
    "bgs",
    "religion"
  ];

  const SUBJECT_LABELS = {
    bangla: "বাংলা",
    english: "ইংরেজি",
    math: "গণিত",
    science: "বিজ্ঞান",
    bgs: "বাওবি",
    religion: "ধর্ম"
  };

  // =========================
  // GRADE SYSTEM
  // =========================
  function gradePoint(mark) {
    if (mark >= 80) return 5;
    if (mark >= 70) return 4;
    if (mark >= 60) return 3.5;
    if (mark >= 50) return 3;
    if (mark >= 40) return 2;
    if (mark >= 33) return 1;
    return 0;
  }

  // =========================
  // RESULT CALCULATION
  // =========================
  function calculateResult(student, passMark = 33) {

    const marks = SUBJECTS.map(s => Number(student[s] || 0));

    const total = marks.reduce((a, b) => a + b, 0);

    const gpa = (
      marks.reduce((sum, m) => sum + gradePoint(m), 0) / SUBJECTS.length
    ).toFixed(2);

    const status = marks.every(m => m >= passMark) ? "Pass" : "Fail";

    return { total, gpa, status };
  }

  // =========================
  // SHELL WRAPPER
  // =========================
  function shell(title, type, body, options = {}) {

    const schoolBlock = options.showSchoolInfo
      ? `<p>${options.schoolName || ""}</p><p>${options.schoolAddress || ""}</p>`
      : "";

    return `
      <div class="doc-sheet ${type}">
        <header>
          <h3>${title}</h3>
          ${schoolBlock}
        </header>

        <section>
          ${body}
        </section>

        <footer>
          ${options.footerNote || ""}
        </footer>
      </div>
    `;
  }

  // =========================
  // TABULATION SHEET (MAIN)
  // =========================
  function generateTabulationSheet(students, options = {}) {

    const header = `
      <tr>
        <th>আইডি</th>
        <th>নাম</th>
        <th>শ্রেণি</th>
        <th>রোল</th>

        ${SUBJECTS.map(s => `<th>${SUBJECT_LABELS[s]}</th>`).join('')}

        <th>মোট</th>
        <th>GPA</th>
        <th>ফলাফল</th>
      </tr>
    `;

    const rows = students.map(student => {

      const result = calculateResult(student, options.passMark);

      const subjectCells = SUBJECTS.map(s => {
        return `<td>${student[s] || 0}</td>`;
      }).join('');

      return `
        <tr>
          <td>${student.id || "-"}</td>
          <td>${student.name || "-"}</td>
          <td>${student.className || "-"}</td>
          <td>${student.roll || "-"}</td>

          ${subjectCells}

          <td>${result.total}</td>
          <td>${result.gpa}</td>
          <td>${result.status}</td>
        </tr>
      `;
    }).join('');

    return shell("ট্যাবুলেশন শিট", "doc-tabulation", `
      <p>
        <strong>পরীক্ষা:</strong> ${options.examName || "-"} |
        <strong>শিক্ষাবর্ষ:</strong> ${options.academicYear || "-"}
      </p>

      <table border="1" cellspacing="0" cellpadding="8">
        <thead>${header}</thead>
        <tbody>
          ${rows || `<tr><td colspan="${SUBJECTS.length + 4}">কোনো ডাটা পাওয়া যায়নি</td></tr>`}
        </tbody>
      </table>
    `, options);
  }

  // =========================
  // MARKSHEET
  // =========================
  function generateMarksheet(student, options = {}) {

    const result = calculateResult(student, options.passMark);

    const rows = SUBJECTS.map(s => `
      <tr>
        <td>${SUBJECT_LABELS[s]}</td>
        <td>${student[s] || 0}</td>
        <td>${gradePoint(student[s] || 0)}</td>
      </tr>
    `).join('');

    return shell("মার্কশিট", "doc-marksheet", `
      <p><strong>নাম:</strong> ${student.name}</p>
      <p><strong>রোল:</strong> ${student.roll}</p>

      <table border="1" cellspacing="0" cellpadding="8">
        <tr>
          <th>বিষয়</th>
          <th>নম্বর</th>
          <th>গ্রেড পয়েন্ট</th>
        </tr>
        ${rows}
      </table>

      <p><strong>মোট:</strong> ${result.total}</p>
      <p><strong>GPA:</strong> ${result.gpa}</p>
      <p><strong>ফলাফল:</strong> ${result.status}</p>
    `, options);
  }

  // =========================
  // EXPORT
  // =========================
  return {
    generateTabulationSheet,
    generateMarksheet,
    calculateResult
  };

})();
