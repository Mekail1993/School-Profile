const DocumentGenerators = (() => {
  const SUBJECTS = ['bangla', 'english', 'math', 'science', 'religion'];

  function gradePoint(mark) {
    if (mark >= 80) return 5;
    if (mark >= 70) return 4;
    if (mark >= 60) return 3.5;
    if (mark >= 50) return 3;
    if (mark >= 40) return 2;
    if (mark >= 33) return 1;
    return 0;
  }

  function calculateResult(student, passMark = 33) {
    const marks = SUBJECTS.map((s) => Number(student[s] || 0));
    const total = marks.reduce((a, b) => a + b, 0);
    const gpa = (marks.reduce((sum, m) => sum + gradePoint(m), 0) / SUBJECTS.length).toFixed(2);
    const status = marks.every((m) => m >= passMark) ? 'Pass' : 'Fail';
    return { total, gpa, status };
  }

  function shell(title, type, body, options) {
    const schoolBlock = options.showSchoolInfo
      ? `<p>${options.schoolName}</p><p>${options.schoolAddress} | কোড: ${options.schoolCode}</p>`
      : '';
    const footerBlock = options.showFooter ? options.footerNote : '';
    return `
      <div class="doc-sheet ${type}">
        <header class="doc-head">
          <h3>${title}</h3>
          ${schoolBlock}
        </header>
        <section class="doc-body">${body}</section>
        <footer class="doc-foot">${footerBlock}</footer>
      </div>
    `;
  }

  function rows(student, options) {
    const labels = options.subjectList || ['বাংলা', 'ইংরেজি', 'গণিত', 'বিজ্ঞান', 'ধর্ম'];
    return SUBJECTS.map((subject, index) => {
      const mark = Number(student[subject] || 0);
      return `<tr><td>${labels[index] || subject}</td><td>${mark}</td><td>${gradePoint(mark)}</td></tr>`;
    }).join('');
  }

  function generateAdmitCard(student, options) {
    return shell('প্রবেশপত্র', 'doc-admit', `
      <p><strong>পরীক্ষা:</strong> ${options.examName} (${options.academicYear})</p>
      <p><strong>ইউজার আইডি:</strong> ${student.id} | <strong>নাম:</strong> ${student.name}</p>
      <p><strong>শ্রেণি:</strong> ${student.className || '-'} | <strong>শাখা:</strong> ${student.section || '-'} | <strong>রোল:</strong> ${student.roll}</p>
      ${options.showGuardian ? `<p><strong>অভিভাবক:</strong> ${student.guardian || '-'} | <strong>মোবাইল:</strong> ${student.mobile || '-'}</p>` : ''}
      ${options.showInstructions ? `<p class="doc-note"><strong>নির্দেশনা:</strong> ${options.admitInstructions}</p>` : ''}
      ${options.showTeacherSign ? `<p><strong>অনুমোদিত শিক্ষক:</strong> ${options.authorizedTeacher}</p>` : ''}
    `, options);
  }

  function generateSeatPlan(student, options) {
    return shell('আসন বিন্যাস', 'doc-seat', `
      <p><strong>কেন্দ্র:</strong> ${options.centerName}</p>
      <p><strong>নাম:</strong> ${student.name} | <strong>রোল:</strong> ${student.roll}</p>
      <p><strong>শ্রেণি/শাখা:</strong> ${student.className || '-'} / ${student.section || '-'}</p>
      <p><strong>সিট নং:</strong> ${(student.className || 'C').replace('Class ', '')}${student.section || ''}-${String(student.roll).padStart(3, '0')}</p>
      <p><strong>কক্ষ:</strong> রুম ${100 + Number(student.roll) % 10}</p>
      ${options.showInstructions ? `<p class=\"doc-note\"><strong>নির্দেশনা:</strong> ${options.seatInstructions}</p>` : ''}
    `, options);
  }

  function generateProgressReport(student, options) {
    const result = calculateResult(student, options.passMark);
    return shell('অগ্রগতি প্রতিবেদন', 'doc-progress', `
      <p><strong>শিক্ষার্থী:</strong> ${student.name} (${student.id})</p>
      <table><thead><tr><th>বিষয়</th><th>নম্বর</th><th>গ্রেড পয়েন্ট</th></tr></thead><tbody>${rows(student, options)}</tbody></table>
      <p><strong>মোট:</strong> ${result.total}/500 | <strong>GPA:</strong> ${result.gpa} | <strong>অবস্থা:</strong> ${result.status === 'Pass' ? 'পাস' : 'ফেল'}</p>
      ${options.showTeacherSign ? `<p><strong>পাস নম্বর:</strong> ${options.passMark} | <strong>শিক্ষক:</strong> ${options.authorizedTeacher}</p>` : `<p><strong>পাস নম্বর:</strong> ${options.passMark}</p>`}
      ${options.showInstructions ? `<p class=\"doc-note\"><strong>মন্তব্য:</strong> ${options.progressComment}</p>` : ''}
    `, options);
  }

  function generateTabulationSheet(students, options) {
    const data = students.map((student) => {
      const res = calculateResult(student, options.passMark);
      return `<tr><td>${student.id}</td><td>${student.name}</td><td>${student.className || '-'}</td><td>${student.section || '-'}</td><td>${student.roll}</td><td>${res.total}</td><td>${res.gpa}</td><td>${res.status}</td></tr>`;
    }).join('');

    return shell('ট্যাবুলেশন শিট', 'doc-tabulation', `
      <p><strong>পরীক্ষা:</strong> ${options.examName} | <strong>শিক্ষাবর্ষ:</strong> ${options.academicYear}</p>
      <table><thead><tr><th>ইউজার আইডি</th><th>নাম</th><th>শ্রেণি</th><th>শাখা</th><th>রোল</th><th>মোট</th><th>GPA</th><th>অবস্থা</th></tr></thead><tbody>${data || '<tr><td colspan="8">কোনো নম্বর পাওয়া যায়নি</td></tr>'}</tbody></table>
    `, options);
  }

  function generateMarksheet(student, options) {
    const result = calculateResult(student, options.passMark);
    return shell('মার্কশিট', 'doc-marksheet', `
      <p><strong>নাম:</strong> ${student.name} | <strong>ইউজার আইডি:</strong> ${student.id}</p>
      <p><strong>শ্রেণি:</strong> ${student.className || '-'} | <strong>শাখা:</strong> ${student.section || '-'} | <strong>রোল:</strong> ${student.roll}</p>
      <table><thead><tr><th>বিষয়</th><th>নম্বর</th><th>গ্রেড পয়েন্ট</th></tr></thead><tbody>${rows(student, options)}</tbody></table>
      <p><strong>মোট:</strong> ${result.total}/500 | <strong>GPA:</strong> ${result.gpa} | <strong>ফলাফল:</strong> ${result.status === 'Pass' ? 'পাস' : 'ফেল'}</p>
      ${options.showTeacherSign ? `<p><strong>প্রধান শিক্ষক:</strong> ${options.headTeacher} | <strong>অনুমোদিত শিক্ষক:</strong> ${options.authorizedTeacher}</p>` : ''}
      ${options.showInstructions ? `<p class=\"doc-note\"><strong>মন্তব্য:</strong> ${options.marksheetComment}</p>` : ''}
    `, options);
  }

  return {
    calculateResult,
    generateAdmitCard,
    generateSeatPlan,
    generateProgressReport,
    generateTabulationSheet,
    generateMarksheet
  };
})();
