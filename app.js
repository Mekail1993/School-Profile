const form = document.getElementById('studentForm');
const tableBody = document.getElementById('studentTableBody');
const selector = document.getElementById('studentSelector');
const output = document.getElementById('documentOutput');

const SUBJECTS = ['bangla', 'english', 'math', 'science', 'religion'];

const getStudents = () => JSON.parse(localStorage.getItem('students') || '[]');
const setStudents = (students) => localStorage.setItem('students', JSON.stringify(students));

function gradePoint(mark) {
  if (mark >= 80) return 5;
  if (mark >= 70) return 4;
  if (mark >= 60) return 3.5;
  if (mark >= 50) return 3;
  if (mark >= 40) return 2;
  if (mark >= 33) return 1;
  return 0;
}

function calculateResult(student) {
  const marks = SUBJECTS.map((s) => Number(student[s]));
  const total = marks.reduce((a, b) => a + b, 0);
  const gpa = (marks.reduce((sum, m) => sum + gradePoint(m), 0) / SUBJECTS.length).toFixed(2);
  const status = marks.every((m) => m >= 33) ? 'Pass' : 'Fail';
  return { total, gpa, status };
}

function refreshUI() {
  const students = getStudents();
  tableBody.innerHTML = '';
  selector.innerHTML = '<option value="">Select</option>';

  students.sort((a, b) => (a.className + a.section + Number(a.roll)).localeCompare(b.className + b.section + Number(b.roll)));

  students.forEach((student) => {
    const result = calculateResult(student);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.className}</td>
      <td>${student.section}</td>
      <td>${student.roll}</td>
      <td>${result.total}</td>
      <td>${result.gpa}</td>
    `;
    tableBody.appendChild(row);

    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = `${student.id} - ${student.name}`;
    selector.appendChild(option);
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const student = Object.fromEntries(formData.entries());

  const students = getStudents();
  const exists = students.find((s) => s.id === student.id);

  if (exists) {
    alert('Student ID already exists. Use a unique ID.');
    return;
  }

  setStudents([...students, student]);
  form.reset();
  refreshUI();
});

document.getElementById('deleteBtn').addEventListener('click', () => {
  const id = selector.value;
  if (!id) return alert('Select a student first.');
  const students = getStudents().filter((s) => s.id !== id);
  setStudents(students);
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

function generateAdmitCard(student) {
  return `
    <h3>Admit Card</h3>
    <p><strong>School:</strong> Bangladesh Primary School</p>
    <p><strong>Name:</strong> ${student.name}</p>
    <p><strong>Student ID:</strong> ${student.id}</p>
    <p><strong>Class:</strong> ${student.className} | <strong>Section:</strong> ${student.section} | <strong>Roll:</strong> ${student.roll}</p>
    <p><strong>Guardian:</strong> ${student.guardian} | <strong>Mobile:</strong> ${student.mobile}</p>
    <hr/>
    <p>Examination: Annual Assessment 2026</p>
  `;
}

function generateSeatPlan(student) {
  return `
    <h3>Seat Plan</h3>
    <p><strong>Examination Center:</strong> Main Campus Hall</p>
    <p><strong>Name:</strong> ${student.name}</p>
    <p><strong>Class/Section:</strong> ${student.className} - ${student.section}</p>
    <p><strong>Roll:</strong> ${student.roll}</p>
    <p><strong>Seat No:</strong> ${student.className.replace('Class ', '')}${student.section}-${String(student.roll).padStart(3, '0')}</p>
    <p><strong>Room:</strong> Room ${100 + Number(student.roll) % 10}</p>
  `;
}

function subjectRows(student) {
  return SUBJECTS.map((subject) => {
    const mark = Number(student[subject]);
    return `<tr><td>${subject.toUpperCase()}</td><td>${mark}</td><td>${gradePoint(mark)}</td></tr>`;
  }).join('');
}

function generateProgressReport(student) {
  const result = calculateResult(student);
  return `
    <h3>Progress Report</h3>
    <p><strong>Student:</strong> ${student.name} (${student.id})</p>
    <table>
      <thead><tr><th>Subject</th><th>Mark</th><th>Grade Point</th></tr></thead>
      <tbody>${subjectRows(student)}</tbody>
    </table>
    <p><strong>Total:</strong> ${result.total}/500</p>
    <p><strong>GPA:</strong> ${result.gpa} | <strong>Status:</strong> ${result.status}</p>
  `;
}

function generateTabulationSheet() {
  const rows = getStudents().map((s) => {
    const { total, gpa, status } = calculateResult(s);
    return `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.className}</td><td>${s.section}</td><td>${s.roll}</td><td>${total}</td><td>${gpa}</td><td>${status}</td></tr>`;
  }).join('');

  return `
    <h3>Tabulation Sheet</h3>
    <table>
      <thead><tr><th>ID</th><th>Name</th><th>Class</th><th>Section</th><th>Roll</th><th>Total</th><th>GPA</th><th>Status</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="8">No student data available</td></tr>'}</tbody>
    </table>
  `;
}

function generateMarksheet(student) {
  const result = calculateResult(student);
  return `
    <h3>Marksheet</h3>
    <p><strong>School:</strong> Bangladesh Primary School</p>
    <p><strong>Name:</strong> ${student.name} | <strong>Class:</strong> ${student.className}</p>
    <p><strong>Section:</strong> ${student.section} | <strong>Roll:</strong> ${student.roll}</p>
    <table>
      <thead><tr><th>Subject</th><th>Marks</th><th>Grade Point</th></tr></thead>
      <tbody>${subjectRows(student)}</tbody>
    </table>
    <p><strong>Total Marks:</strong> ${result.total}/500</p>
    <p><strong>GPA:</strong> ${result.gpa} | <strong>Result:</strong> ${result.status}</p>
  `;
}

document.querySelectorAll('[data-doc]').forEach((button) => {
  button.addEventListener('click', () => {
    const type = button.dataset.doc;

    if (type === 'tabulation') {
      output.innerHTML = generateTabulationSheet();
      return;
    }

    const student = getSelectedStudent();
    if (!student) return;

    const generators = {
      admit: generateAdmitCard,
      seat: generateSeatPlan,
      progress: generateProgressReport,
      marksheet: generateMarksheet
    };

    output.innerHTML = generators[type](student);
  });
});

document.getElementById('printBtn').addEventListener('click', () => {
  if (!output.textContent.trim()) {
    return alert('Generate a document first.');
  }
  window.print();
});

refreshUI();
