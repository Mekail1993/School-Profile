const form = document.getElementById('studentForm');
const marksForm = document.getElementById('marksForm');
const marksStudentId = document.getElementById('marksStudentId');
const tableBody = document.getElementById('studentTableBody');
const selector = document.getElementById('studentSelector');
const output = document.getElementById('documentOutput');
const statsGrid = document.getElementById('statsGrid');
const classDistribution = document.getElementById('classDistribution');
const importInput = document.getElementById('importInput');
const SUBJECTS = ['bangla', 'english', 'math', 'science', 'religion'];

const getStudents = () => JSON.parse(localStorage.getItem('students') || '[]');
const setStudents = (students) => localStorage.setItem('students', JSON.stringify(students));

function getDocOptions() {
  return {
    schoolName: document.getElementById('optSchoolName').value.trim() || 'Bangladesh Primary School',
    examName: document.getElementById('optExamName').value.trim() || 'Annual Assessment',
    centerName: document.getElementById('optCenterName').value.trim() || 'Main Campus Hall',
    footerNote: document.getElementById('optFooterNote').value.trim() || '',
    admitInstructions: document.getElementById('optAdmitInstructions').value.trim() || '',
    seatInstructions: document.getElementById('optSeatInstructions').value.trim() || '',
    progressComment: document.getElementById('optProgressComment').value.trim() || '',
    marksheetComment: document.getElementById('optMarksheetComment').value.trim() || ''
  };
}

function hasMarks(student) {
  return SUBJECTS.every((subject) => student[subject] !== undefined && student[subject] !== '');
}

function renderDashboard(students) {
  const markedStudents = students.filter(hasMarks);
  const passed = markedStudents.filter((student) => DocumentGenerators.calculateResult(student).status === 'Pass');
  const averageGpa = markedStudents.length
    ? (markedStudents.reduce((sum, student) => sum + Number(DocumentGenerators.calculateResult(student).gpa), 0) / markedStudents.length).toFixed(2)
    : '0.00';

  const cards = [
    { title: 'Total Students', value: students.length },
    { title: 'Marks Entered', value: markedStudents.length },
    { title: 'Pass Rate', value: `${markedStudents.length ? Math.round((passed.length / markedStudents.length) * 100) : 0}%` },
    { title: 'Average GPA', value: averageGpa }
  ];

  statsGrid.innerHTML = cards.map((card) => `
    <div class="stat-card">
      <h4>${card.title}</h4>
      <p>${card.value}</p>
    </div>
  `).join('');

  const distributionMap = students.reduce((acc, student) => {
    const key = student.className || 'Unassigned';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const maxCount = Math.max(...Object.values(distributionMap), 1);
  classDistribution.innerHTML = Object.entries(distributionMap).map(([className, count]) => `
    <div class="dist-row">
      <span>${className}</span>
      <div class="bar-wrap"><div class="bar" style="width:${(count / maxCount) * 100}%"></div></div>
      <strong>${count}</strong>
    </div>
  `).join('') || '<p>No student data available.</p>';
}

function refreshUI() {
  const students = getStudents();
  tableBody.innerHTML = '';
  selector.innerHTML = '<option value="">Select</option>';
  marksStudentId.innerHTML = '<option value="">Select</option>';

  students.sort((a, b) => (a.className + a.section + Number(a.roll)).localeCompare(b.className + b.section + Number(b.roll)));

  students.forEach((student) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.className || '-'}</td>
      <td>${student.section || '-'}</td>
      <td>${student.roll}</td>
      <td>${hasMarks(student) ? 'Entered' : 'Pending'}</td>
    `;
    tableBody.appendChild(row);

    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = `${student.id} - ${student.name}`;
    selector.appendChild(option);
    marksStudentId.appendChild(option.cloneNode(true));
  });

  renderDashboard(students);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const student = Object.fromEntries(new FormData(form).entries());

  if (!student.id || !student.name || !student.roll) {
    alert('User ID, Name, and Roll No are mandatory.');
    return;
  }

  const students = getStudents();
  if (students.some((s) => s.id === student.id)) {
    alert('User ID already exists. Use a unique ID.');
    return;
  }

  setStudents([...students, student]);
  form.reset();
  refreshUI();
});

marksForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const { id, ...marks } = Object.fromEntries(new FormData(marksForm).entries());

  const students = getStudents();
  const student = students.find((item) => item.id === id);
  if (!student) return alert('Please select a valid student for marks entry.');

  SUBJECTS.forEach((subject) => {
    student[subject] = marks[subject];
  });

  setStudents(students);
  marksForm.reset();
  refreshUI();
});

document.getElementById('deleteBtn').addEventListener('click', () => {
  const id = selector.value;
  if (!id) return alert('Select a student first.');
  setStudents(getStudents().filter((s) => s.id !== id));
  output.innerHTML = '';
  refreshUI();
});

function getSelectedStudent() {
  const id = selector.value;
  if (!id) {
    alert('Please select a student.');
    return null;
  }
  return getStudents().find((s) => s.id === id);
}

function generateDocumentHtml(type, student) {
  const options = getDocOptions();
  const generators = {
    admit: () => DocumentGenerators.generateAdmitCard(student, options),
    seat: () => DocumentGenerators.generateSeatPlan(student, options),
    progress: () => DocumentGenerators.generateProgressReport(student, options),
    tabulation: () => DocumentGenerators.generateTabulationSheet(getStudents().filter(hasMarks), options),
    marksheet: () => DocumentGenerators.generateMarksheet(student, options)
  };
  return generators[type]();
}

function htmlToPdf(filename, html) {
  if (!window.jspdf) {
    alert('PDF library failed to load.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  const lines = pdf.splitTextToSize(text, 540);
  pdf.text(lines, 30, 40);
  pdf.save(filename);
}

function previewOrDownload(type, mode) {
  const student = type === 'tabulation' ? null : getSelectedStudent();
  if (type !== 'tabulation' && !student) return;

  if ((type === 'progress' || type === 'marksheet') && !hasMarks(student)) {
    alert('Please complete marks entry for this student first.');
    return;
  }

  if (type === 'tabulation' && !getStudents().some(hasMarks)) {
    alert('No marks entries found. Please save marks first.');
    return;
  }

  const html = generateDocumentHtml(type, student);
  if (mode === 'preview') {
    output.innerHTML = html;
  } else {
    const selectedId = student ? student.id : 'all';
    htmlToPdf(`${type}-${selectedId}.pdf`, html);
  }
}

document.querySelectorAll('[data-doc]').forEach((button) => {
  button.addEventListener('click', () => previewOrDownload(button.dataset.doc, 'preview'));
});

document.querySelectorAll('[data-download]').forEach((button) => {
  button.addEventListener('click', () => previewOrDownload(button.dataset.download, 'download'));
});

document.getElementById('batchDownloadBtn').addEventListener('click', () => {
  const student = getSelectedStudent();
  if (!student) return;

  const docs = ['admit', 'seat'];
  if (hasMarks(student)) docs.push('progress', 'marksheet');
  if (getStudents().some(hasMarks)) docs.push('tabulation');

  docs.forEach((type, idx) => {
    setTimeout(() => {
      const html = generateDocumentHtml(type, student);
      const id = type === 'tabulation' ? 'all' : student.id;
      htmlToPdf(`${type}-${id}.pdf`, html);
    }, idx * 400);
  });
});

document.getElementById('printBtn').addEventListener('click', () => {
  if (!output.textContent.trim()) return alert('Generate a document preview first.');
  window.print();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(getStudents(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'students-export.json';
  anchor.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('Invalid JSON format.');

    const sanitized = parsed.filter((student) => student && student.id && student.name && student.roll);
    if (!sanitized.length) {
      alert('No valid student records found in imported file.');
      return;
    }

    setStudents(sanitized);
    refreshUI();
    alert('Student list imported successfully.');
  } catch (error) {
    alert(`Import failed: ${error.message}`);
  } finally {
    importInput.value = '';
  }
});

refreshUI();
