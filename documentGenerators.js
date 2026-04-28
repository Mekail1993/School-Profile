function generateTabulationSheet(students, options) {

  const SUBJECTS = ['bangla', 'english', 'math', 'science', 'religion'];

  const LABELS = options.subjectList || ['বাংলা', 'ইংরেজি', 'গণিত', 'বিজ্ঞান', 'ধর্ম'];

  function gradePoint(mark) {
    if (mark >= 80) return 5;
    if (mark >= 70) return 4;
    if (mark >= 60) return 3.5;
    if (mark >= 50) return 3;
    if (mark >= 40) return 2;
    if (mark >= 33) return 1;
    return 0;
  }

  function calculate(student) {
    const marks = SUBJECTS.map(s => Number(student[s] || 0));

    const total = marks.reduce((a, b) => a + b, 0);

    const gpa = (
      marks.reduce((sum, m) => sum + gradePoint(m), 0) / SUBJECTS.length
    ).toFixed(2);

    const status = marks.every(m => m >= (options.passMark || 33)) ? 'Pass' : 'Fail';

    return { total, gpa, status };
  }

  const header = `
    <tr>
      <th>আইডি</th>
      <th>নাম</th>
      <th>শ্রেণি</th>
      <th>রোল</th>
      ${LABELS.map(l => `<th>${l}</th>`).join('')}
      <th>মোট</th>
      <th>GPA</th>
      <th>ফলাফল</th>
    </tr>
  `;

  const rows = students.map(student => {

    const result = calculate(student);

    const subjectMarks = SUBJECTS.map(s => {
      return `<td>${student[s] || 0}</td>`;
    }).join('');

    return `
      <tr>
        <td>${student.id}</td>
        <td>${student.name}</td>
        <td>${student.className || '-'}</td>
        <td>${student.roll || '-'}</td>
        ${subjectMarks}
        <td>${result.total}</td>
        <td>${result.gpa}</td>
        <td>${result.status}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="doc-sheet doc-tabulation">
      <h3>ট্যাবুলেশন শিট</h3>

      <p>
        <strong>পরীক্ষা:</strong> ${options.examName || '-'} |
        <strong>শিক্ষাবর্ষ:</strong> ${options.academicYear || '-'}
      </p>

      <table border="1" cellspacing="0" cellpadding="8">
        <thead>${header}</thead>
        <tbody>
          ${rows || `<tr><td colspan="8">কোনো ডাটা পাওয়া যায়নি</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}
