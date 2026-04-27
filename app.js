const form = document.getElementById('studentForm');
const tableBody = document.getElementById('studentTableBody');
const selector = document.getElementById('studentSelector');
const output = document.getElementById('documentOutput');

const getStudents = () => JSON.parse(localStorage.getItem('students') || '[]');
const setStudents = (students) => localStorage.setItem('students', JSON.stringify(students));

function refreshUI() {
  const students = getStudents();
  tableBody.innerHTML = '';
  selector.innerHTML = '<option value="">Select</option>';

  students.sort((a, b) => (a.className + a.section + Number(a.roll)).localeCompare(b.className + b.section + Number(b.roll)));

  students.forEach((student) => {
    const result = DocumentGenerators.calculateResult(student);

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

document.querySelectorAll('[data-doc]').forEach((button) => {
  button.addEventListener('click', () => {
    const type = button.dataset.doc;

    if (type === 'tabulation') {
      output.innerHTML = DocumentGenerators.generateTabulationSheet(getStudents());
      return;
    }

    const student = getSelectedStudent();
    if (!student) return;

    const generators = {
      admit: DocumentGenerators.generateAdmitCard,
      seat: DocumentGenerators.generateSeatPlan,
      progress: DocumentGenerators.generateProgressReport,
      marksheet: DocumentGenerators.generateMarksheet
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
