const form = document.getElementById('studentForm');
const marksForm = document.getElementById('marksForm');
const marksStudentId = document.getElementById('marksStudentId');
const tableBody = document.getElementById('studentTableBody');
const selector = document.getElementById('studentSelector');
const output = document.getElementById('documentOutput');
const SUBJECTS = ['bangla', 'english', 'math', 'science', 'religion'];

const getStudents = () => JSON.parse(localStorage.getItem('students') || '[]');
const setStudents = (students) => localStorage.setItem('students', JSON.stringify(students));

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
      <td>${student.className}</td>
      <td>${student.section}</td>
      <td>${student.roll}</td>
    `;
    tableBody.appendChild(row);

    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = `${student.id} - ${student.name}`;
    selector.appendChild(option);
    marksStudentId.appendChild(option.cloneNode(true));
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

marksForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(marksForm);
  const { id, ...marks } = Object.fromEntries(formData.entries());

  if (!id) {
    alert('Please select a student for marks entry.');
    return;
  }

  const students = getStudents();
  const student = students.find((item) => item.id === id);

  if (!student) {
    alert('Student not found.');
    return;
  }

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

function hasMarks(student) {
  return SUBJECTS.every((subject) => student[subject] !== undefined && student[subject] !== '');
}

document.querySelectorAll('[data-doc]').forEach((button) => {
  button.addEventListener('click', () => {
    const type = button.dataset.doc;

    if (type === 'tabulation') {
      const markedStudents = getStudents().filter(hasMarks);
      if (!markedStudents.length) {
        alert('No marks entries found. Please save marks first.');
        return;
      }
      output.innerHTML = DocumentGenerators.generateTabulationSheet(markedStudents);
      return;
    }

    const student = getSelectedStudent();
    if (!student) return;
    if (!hasMarks(student)) {
      alert('Please complete marks entry for this student first.');
      return;
    }

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
