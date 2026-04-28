const SUBJECTS = ['bangla', 'english', 'math', 'science', 'religion'];

const getStudents = () => JSON.parse(localStorage.getItem('students') || '[]');
const setStudents = (students) => localStorage.setItem('students', JSON.stringify(students));
const getSchoolProfile = () => JSON.parse(localStorage.getItem('schoolProfile') || '{}');
const setSchoolProfile = (profile) => localStorage.setItem('schoolProfile', JSON.stringify(profile));
const getTeachers = () => JSON.parse(localStorage.getItem('teachers') || '[]');
const setTeachers = (teachers) => localStorage.setItem('teachers', JSON.stringify(teachers));
const getConfig = () => JSON.parse(localStorage.getItem('config') || '{}');
const setConfig = (config) => localStorage.setItem('config', JSON.stringify(config));
const getRoutine = () => JSON.parse(localStorage.getItem('routine') || '[]');
const setRoutine = (routine) => localStorage.setItem('routine', JSON.stringify(routine));

const el = (id) => document.getElementById(id);

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}

function setActiveMenu() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu-bar a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === current) link.classList.add('active');
  });
}

function hasMarks(student) {
  return SUBJECTS.every((subject) => student[subject] !== undefined && student[subject] !== '');
}

function populateStudentSelectors() {
  const selectors = [el('studentSelector'), el('marksStudentId')].filter(Boolean);
  selectors.forEach((select) => {
    select.innerHTML = '<option value="">নির্বাচন করুন</option>';
    getStudents().forEach((student) => {
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = `${student.id} - ${student.name}`;
      select.appendChild(option);
    });
  });
}

function refreshStudentTable() {
  const body = el('studentTableBody');
  if (!body) return;
  body.innerHTML = '';

  getStudents().forEach((student) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${student.id}</td><td>${student.name}</td><td>${student.className || '-'}</td><td>${student.section || '-'}</td><td>${student.roll}</td><td>${hasMarks(student) ? 'সম্পন্ন' : 'বাকি'}</td>`;
    body.appendChild(row);
  });
}

function renderDashboard() {
  const statsGrid = el('statsGrid');
  const classDistribution = el('classDistribution');
  if (!statsGrid || !classDistribution) return;

  const students = getStudents();
  const markedStudents = students.filter(hasMarks);
  const passMark = Number(getConfig().passMark || 33);
  const passed = markedStudents.filter((student) => DocumentGenerators.calculateResult(student, passMark).status === 'Pass');
  const avgGpa = markedStudents.length
    ? (markedStudents.reduce((sum, student) => sum + Number(DocumentGenerators.calculateResult(student, passMark).gpa), 0) / markedStudents.length).toFixed(2)
    : '0.00';

  const cards = [
    { title: 'মোট শিক্ষার্থী', value: students.length },
    { title: 'নম্বর এন্ট্রি সম্পন্ন', value: markedStudents.length },
    { title: 'পাসের হার', value: `${markedStudents.length ? Math.round((passed.length / markedStudents.length) * 100) : 0}%` },
    { title: 'গড় GPA', value: avgGpa }
  ];
  statsGrid.innerHTML = cards.map((card) => `<div class="stat-card"><h4>${card.title}</h4><p>${card.value}</p></div>`).join('');

  const byClass = students.reduce((acc, s) => {
    const key = s.className || 'শ্রেণি নির্ধারিত নয়';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const max = Math.max(...Object.values(byClass), 1);
  classDistribution.innerHTML = Object.entries(byClass).map(([name, count]) => `<div class="dist-row"><span>${name}</span><div class="bar-wrap"><div class="bar" style="width:${(count / max) * 100}%"></div></div><strong>${count}</strong></div>`).join('') || '<p>কোনো শিক্ষার্থী তথ্য পাওয়া যায়নি।</p>';
}

function renderTeachers() {
  const table = el('teacherTableBody');
  const authSelect = el('optAuthorizedTeacher');
  const teachers = getTeachers();

  if (table) {
    table.innerHTML = '';
    teachers.forEach((teacher, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${teacher.name}</td><td>${teacher.designation || '-'}</td><td>${teacher.mobile || '-'}</td><td><button type="button" class="danger" data-teacher-delete="${index}">মুছুন</button></td>`;
      table.appendChild(row);
    });
  }

  if (authSelect) {
    authSelect.innerHTML = '<option value="">শিক্ষক নির্বাচন করুন</option>';
    teachers.forEach((teacher) => {
      const option = document.createElement('option');
      option.value = teacher.name;
      option.textContent = `${teacher.name} (${teacher.designation || 'শিক্ষক'})`;
      authSelect.appendChild(option);
    });
  }
}

function getDocOptions() {
  const profile = getSchoolProfile();
  const config = getConfig();
  return {
    schoolName: el('optSchoolName')?.value || profile.schoolName || 'বাংলাদেশ প্রাথমিক বিদ্যালয়',
    schoolCode: profile.schoolCode || '-',
    schoolAddress: profile.schoolAddress || '-',
    schoolPhone: profile.schoolPhone || '-',
    headTeacher: profile.headTeacher || '-',
    academicYear: config.academicYear || '2026',
    passMark: Number(config.passMark || 33),
    examName: el('optExamName')?.value || 'বার্ষিক মূল্যায়ন',
    centerName: el('optCenterName')?.value || 'মেইন ক্যাম্পাস হল',
    footerNote: el('optFooterNote')?.value || '',
    admitInstructions: el('optAdmitInstructions')?.value || '',
    seatInstructions: el('optSeatInstructions')?.value || '',
    progressComment: el('optProgressComment')?.value || '',
    marksheetComment: el('optMarksheetComment')?.value || '',
    authorizedTeacher: el('optAuthorizedTeacher')?.value || '-'
  };
}

function getSelectedStudent() {
  const id = el('studentSelector')?.value;
  if (!id) return null;
  return getStudents().find((s) => s.id === id) || null;
}

function htmlToPdf(filename, html) {
  if (!window.jspdf) return;
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const text = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/tr>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').trim();
  pdf.text(pdf.splitTextToSize(text, 540), 30, 40);
  pdf.save(filename);
}

function generateDocumentHtml(type, student) {
  const options = getDocOptions();
  const markedStudents = getStudents().filter(hasMarks);
  if (type === 'tabulation') return DocumentGenerators.generateTabulationSheet(markedStudents, options);
  const generators = {
    admit: DocumentGenerators.generateAdmitCard,
    seat: DocumentGenerators.generateSeatPlan,
    progress: DocumentGenerators.generateProgressReport,
    marksheet: DocumentGenerators.generateMarksheet
  };
  return generators[type](student, options);
}

function renderRoutineTable() {
  const body = el('routineTableBody');
  if (!body) return;
  body.innerHTML = '';
  getRoutine().forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${item.className}</td><td>${item.day}</td><td>${item.period}</td><td>${item.subject}</td><td>${item.time}</td><td><button type="button" class="danger" data-routine-delete="${index}">মুছুন</button></td>`;
    body.appendChild(row);
  });
}

function initForms() {
  el('studentForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const student = Object.fromEntries(new FormData(e.target).entries());
    if (!student.id || !student.name || !student.roll) return showToast('ইউজার আইডি, নাম এবং রোল নম্বর বাধ্যতামূলক।', 'error');
    if (getStudents().some((s) => s.id === student.id)) return showToast('এই ইউজার আইডি ইতোমধ্যে রয়েছে।', 'error');
    setStudents([...getStudents(), student]);
    e.target.reset();
    populateStudentSelectors();
    refreshStudentTable();
    renderDashboard();
    showToast('শিক্ষার্থী সফলভাবে সংরক্ষণ করা হয়েছে।', 'success');
  });

  el('marksForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const { id, ...marks } = Object.fromEntries(new FormData(e.target).entries());
    const students = getStudents();
    const student = students.find((s) => s.id === id);
    if (!student) return showToast('সঠিক শিক্ষার্থী নির্বাচন করুন।', 'error');
    SUBJECTS.forEach((subject) => { student[subject] = marks[subject]; });
    setStudents(students);
    e.target.reset();
    refreshStudentTable();
    renderDashboard();
    showToast('নম্বর সফলভাবে সংরক্ষণ করা হয়েছে।', 'success');
  });

  el('deleteBtn')?.addEventListener('click', () => {
    const student = getSelectedStudent();
    if (!student) return showToast('প্রথমে শিক্ষার্থী নির্বাচন করুন।', 'error');
    if (!confirm(`আপনি কি ${student.name} কে মুছে ফেলতে চান?`)) return;
    setStudents(getStudents().filter((s) => s.id !== student.id));
    populateStudentSelectors();
    refreshStudentTable();
    renderDashboard();
    showToast('শিক্ষার্থী মুছে ফেলা হয়েছে।', 'success');
  });

  el('schoolProfileForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    setSchoolProfile(Object.fromEntries(new FormData(e.target).entries()));
    showToast('স্কুল প্রোফাইল সংরক্ষিত হয়েছে।', 'success');
  });

  el('teacherForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const teacher = Object.fromEntries(new FormData(e.target).entries());
    if (!teacher.name) return showToast('শিক্ষকের নাম বাধ্যতামূলক।', 'error');
    setTeachers([...getTeachers(), teacher]);
    e.target.reset();
    renderTeachers();
    showToast('শিক্ষক যোগ করা হয়েছে।', 'success');
  });

  el('teacherTableBody')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-teacher-delete]');
    if (!button) return;
    const index = Number(button.dataset.teacherDelete);
    if (!confirm('আপনি কি এই শিক্ষককে মুছে ফেলতে চান?')) return;
    setTeachers(getTeachers().filter((_, i) => i !== index));
    renderTeachers();
    showToast('শিক্ষক মুছে ফেলা হয়েছে।', 'success');
  });

  el('configForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const config = Object.fromEntries(new FormData(e.target).entries());
    config.showLogo = el('cfgShowLogo')?.checked;
    setConfig(config);
    renderDashboard();
    showToast('সেটিংস সংরক্ষিত হয়েছে।', 'success');
  });

  el('routineForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const item = Object.fromEntries(new FormData(e.target).entries());
    setRoutine([...getRoutine(), item]);
    e.target.reset();
    renderRoutineTable();
    showToast('ক্লাস রুটিন সংরক্ষিত হয়েছে।', 'success');
  });

  el('routineTableBody')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-routine-delete]');
    if (!button) return;
    const index = Number(button.dataset.routineDelete);
    if (!confirm('আপনি কি এই রুটিন এন্ট্রি মুছে ফেলতে চান?')) return;
    setRoutine(getRoutine().filter((_, i) => i !== index));
    renderRoutineTable();
    showToast('রুটিন এন্ট্রি মুছে ফেলা হয়েছে।', 'success');
  });
}

function initDashboardTransfer() {
  el('exportBtn')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(getStudents(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'students-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
  });

  el('importInput')?.addEventListener('change', async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error('ভুল JSON ফরম্যাট।');
      setStudents(parsed.filter((s) => s && s.id && s.name && s.roll));
      populateStudentSelectors();
      refreshStudentTable();
      renderDashboard();
      showToast('শিক্ষার্থী তালিকা সফলভাবে ইমপোর্ট হয়েছে।', 'success');
    } catch (error) {
      showToast(`ইমপোর্ট ব্যর্থ: ${error.message}`, 'error');
    }
    event.target.value = '';
  });
}

function initDocuments() {
  if (!el('documentOutput')) return;

  const handler = (type, mode) => {
    const student = type === 'tabulation' ? null : getSelectedStudent();
    if (type !== 'tabulation' && !student) return showToast('প্রথমে শিক্ষার্থী নির্বাচন করুন।', 'error');
    if ((type === 'progress' || type === 'marksheet') && !hasMarks(student)) return showToast('এই শিক্ষার্থীর নম্বর এন্ট্রি আগে সম্পন্ন করুন।', 'error');
    const html = generateDocumentHtml(type, student);
    if (mode === 'preview') el('documentOutput').innerHTML = html;
    else htmlToPdf(`${type}-${student ? student.id : 'all'}.pdf`, html);
  };

  document.querySelectorAll('[data-doc]').forEach((button) => {
    button.addEventListener('click', () => handler(button.dataset.doc, 'preview'));
  });
  document.querySelectorAll('[data-download]').forEach((button) => {
    button.addEventListener('click', () => handler(button.dataset.download, 'download'));
  });

  el('batchDownloadBtn')?.addEventListener('click', () => {
    const student = getSelectedStudent();
    if (!student) return showToast('প্রথমে শিক্ষার্থী নির্বাচন করুন।', 'error');
    const docs = ['admit', 'seat'];
    if (hasMarks(student)) docs.push('progress', 'marksheet');
    if (getStudents().some(hasMarks)) docs.push('tabulation');
    docs.forEach((type, idx) => setTimeout(() => handler(type, 'download'), idx * 350));
  });

  el('printBtn')?.addEventListener('click', () => {
    if (!el('documentOutput').textContent.trim()) return showToast('প্রথমে ডকুমেন্ট প্রিভিউ তৈরি করুন।', 'error');
    window.print();
  });
}

function loadSettings() {
  const profile = getSchoolProfile();
  if (el('schoolName')) el('schoolName').value = profile.schoolName || 'বাংলাদেশ প্রাথমিক বিদ্যালয়';
  if (el('schoolCode')) el('schoolCode').value = profile.schoolCode || '';
  if (el('schoolAddress')) el('schoolAddress').value = profile.schoolAddress || '';
  if (el('schoolPhone')) el('schoolPhone').value = profile.schoolPhone || '';
  if (el('headTeacher')) el('headTeacher').value = profile.headTeacher || '';
  if (el('optSchoolName')) el('optSchoolName').value = profile.schoolName || 'বাংলাদেশ প্রাথমিক বিদ্যালয়';

  const config = getConfig();
  if (el('cfgAcademicYear')) el('cfgAcademicYear').value = config.academicYear || '2026';
  if (el('cfgPassMark')) el('cfgPassMark').value = config.passMark || 33;
  if (el('cfgGpaScale')) el('cfgGpaScale').value = config.gpaScale || '5';
  if (el('cfgShowLogo')) el('cfgShowLogo').checked = config.showLogo !== false;
}

loadSettings();
setActiveMenu();
renderTeachers();
populateStudentSelectors();
refreshStudentTable();
renderDashboard();
initForms();
initDashboardTransfer();
initDocuments();
renderRoutineTable();
