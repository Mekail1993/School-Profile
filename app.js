const SUBJECT_KEYS = ['bangla', 'english', 'math', 'science', 'religion'];

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
const getLeaves = () => JSON.parse(localStorage.getItem('leaves') || '[]');
const setLeaves = (leaves) => localStorage.setItem('leaves', JSON.stringify(leaves));

let studentEditId = null;
let teacherEditIndex = null;

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

function getClassList() {
  const config = getConfig();
  const classes = (config.classes || 'Class 1, Class 2, Class 3, Class 4, Class 5')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return classes.length ? classes : ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
}

function populateClassSelects() {
  const classSelects = Array.from(document.querySelectorAll('select[name=\"className\"]'));
  const classes = getClassList();
  classSelects.forEach((select) => {
    const current = select.value;
    select.innerHTML = classes.map((className) => `<option value=\"${className}\">${className}</option>`).join('');
    if (classes.includes(current)) select.value = current;
  });
}

function getExamList() {
  const config = getConfig();
  const exams = (config.examList || '১ম সাময়িক, ২য় সাময়িক, বার্ষিক মূল্যায়ন')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return exams.length ? exams : ['১ম সাময়িক', '২য় সাময়িক', 'বার্ষিক মূল্যায়ন'];
}

function populateExamOptions() {
  const examSelect = el('optExamName');
  if (!examSelect) return;
  const exams = getExamList();
  const current = examSelect.value;
  examSelect.innerHTML = exams.map((exam) => `<option value=\"${exam}\">${exam}</option>`).join('');
  examSelect.value = exams.includes(current) ? current : exams[0];
}

function getSubjectList() {
  const config = getConfig();
  const subjects = (config.subjectList || 'বাংলা, ইংরেজি, গণিত, বিজ্ঞান, ধর্ম')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return subjects.length ? subjects : ['বাংলা', 'ইংরেজি', 'গণিত', 'বিজ্ঞান', 'ধর্ম'];
}

function renderMarksFields() {
  const container = el('marksFields');
  if (!container) return;
  const labels = getSubjectList();
  container.className = 'grid';
  container.innerHTML = SUBJECT_KEYS.map((key, index) => `<label>${labels[index] || key} <input required type=\"number\" min=\"0\" max=\"100\" name=\"${key}\" /></label>`).join('');
}

function setActiveMenu() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu-bar a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === current) link.classList.add('active');
  });
}

function hasMarks(student) {
  return SUBJECT_KEYS.every((subject) => student[subject] !== undefined && student[subject] !== '');
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
    row.innerHTML = `<td>${student.id}</td><td>${student.name}</td><td>${student.className || '-'}</td><td>${student.section || '-'}</td><td>${student.roll}</td><td>${hasMarks(student) ? 'সম্পন্ন' : 'বাকি'}</td><td><button type=\"button\" data-student-edit=\"${student.id}\">এডিট</button></td>`;
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
      row.innerHTML = `<td>${teacher.name}</td><td>${teacher.designation || '-'}</td><td>${teacher.mobile || '-'}</td><td><button type=\"button\" data-teacher-edit=\"${index}\">এডিট</button> <button type=\"button\" class=\"danger\" data-teacher-delete=\"${index}\">মুছুন</button></td>`;
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
    examName: el('optExamName')?.value || config.examName || getExamList()[0],
    centerName: el('optCenterName')?.value || config.centerName || 'মেইন ক্যাম্পাস হল',
    footerNote: el('optFooterNote')?.value || config.footerNote || '',
    admitInstructions: el('optAdmitInstructions')?.value || config.admitInstructions || '',
    seatInstructions: el('optSeatInstructions')?.value || config.seatInstructions || '',
    progressComment: el('optProgressComment')?.value || config.progressComment || '',
    marksheetComment: el('optMarksheetComment')?.value || config.marksheetComment || '',
    authorizedTeacher: el('optAuthorizedTeacher')?.value || '-',
    showSchoolInfo: el('toggleSchoolInfo') ? el('toggleSchoolInfo').checked : config.toggleSchoolInfo !== false,
    showGuardian: el('toggleGuardian') ? el('toggleGuardian').checked : config.toggleGuardian !== false,
    showInstructions: el('toggleInstructions') ? el('toggleInstructions').checked : config.toggleInstructions !== false,
    showTeacherSign: el('toggleTeacherSign') ? el('toggleTeacherSign').checked : config.toggleTeacherSign !== false,
    showFooter: el('toggleFooter') ? el('toggleFooter').checked : config.toggleFooter !== false,
    subjectList: getSubjectList()
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
  const allStudents = getStudents();
  if (type === 'tabulation') return DocumentGenerators.generateTabulationSheet(allStudents, options);
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

function renderLeaveTable() {
  const body = el('leaveTableBody');
  const teacherSelect = el('leaveTeacher');
  if (teacherSelect) {
    teacherSelect.innerHTML = '<option value=\"\">শিক্ষক নির্বাচন করুন</option>';
    getTeachers().forEach((teacher) => {
      const option = document.createElement('option');
      option.value = teacher.name;
      option.textContent = teacher.name;
      teacherSelect.appendChild(option);
    });
  }
  if (!body) return;
  body.innerHTML = '';
  getLeaves().forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${item.teacher}</td><td>${item.type}</td><td>${item.fromDate} - ${item.toDate}</td><td>${item.reason}</td><td>${item.status}</td><td><button type=\"button\" class=\"danger\" data-leave-delete=\"${index}\">মুছুন</button></td>`;
    body.appendChild(row);
  });
}

function renderOfficialPad() {
  const output = el('officialPadOutput');
  if (!output) return;
  const profile = getSchoolProfile();
  const subject = el('padSubject')?.value || '';
  const recipient = el('padRecipient')?.value || '';
  const date = el('padDate')?.value || '';
  const reference = el('padReference')?.value || '';
  const body = el('padBody')?.value || '';
  output.innerHTML = `<div class=\"doc-sheet\"><div class=\"doc-head\"><h3>${profile.schoolName || 'বাংলাদেশ প্রাথমিক বিদ্যালয়'}</h3><p>${profile.schoolAddress || ''}</p><p>স্মারক নং: ${reference} | তারিখ: ${date}</p></div><div class=\"doc-body\"><p><strong>প্রাপক:</strong> ${recipient}</p><p><strong>বিষয়:</strong> ${subject}</p><p style=\"white-space:pre-line\">${body}</p></div></div>`;
}

function initForms() {
  el('studentForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const student = Object.fromEntries(new FormData(e.target).entries());
    if (!student.id || !student.name || !student.roll) return showToast('ইউজার আইডি, নাম এবং রোল নম্বর বাধ্যতামূলক।', 'error');
    const students = getStudents();
    if (!studentEditId && students.some((s) => s.id === student.id)) return showToast('এই ইউজার আইডি ইতোমধ্যে রয়েছে।', 'error');
    if (studentEditId) {
      const index = students.findIndex((s) => s.id === studentEditId);
      students[index] = { ...students[index], ...student, id: studentEditId };
      setStudents(students);
      studentEditId = null;
      if (el('studentSubmitBtn')) el('studentSubmitBtn').textContent = 'শিক্ষার্থী সংরক্ষণ';
    } else {
      setStudents([...students, student]);
    }
    e.target.reset();
    populateStudentSelectors();
    refreshStudentTable();
    renderDashboard();
    showToast('শিক্ষার্থী তথ্য সংরক্ষণ করা হয়েছে।', 'success');
  });

  el('marksForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const { id, ...marks } = Object.fromEntries(new FormData(e.target).entries());
    const students = getStudents();
    const student = students.find((s) => s.id === id);
    if (!student) return showToast('সঠিক শিক্ষার্থী নির্বাচন করুন।', 'error');
    SUBJECT_KEYS.forEach((subject) => { student[subject] = marks[subject]; });
    setStudents(students);
    e.target.reset();
    refreshStudentTable();
    renderDashboard();
    showToast('নম্বর সফলভাবে সংরক্ষণ করা হয়েছে।', 'success');
  });

  el('loadMarksBtn')?.addEventListener('click', () => {
    const id = el('marksStudentId')?.value;
    const student = getStudents().find((item) => item.id === id);
    if (!student) return showToast('প্রথমে শিক্ষার্থী নির্বাচন করুন।', 'error');
    const form = el('marksForm');
    SUBJECT_KEYS.forEach((subject) => {
      if (form?.elements[subject]) form.elements[subject].value = student[subject] || '';
    });
    showToast('বিদ্যমান নম্বর লোড হয়েছে।', 'success');
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
    const teachers = getTeachers();
    if (teacherEditIndex !== null) {
      teachers[teacherEditIndex] = teacher;
      setTeachers(teachers);
      teacherEditIndex = null;
      if (el('teacherSubmitBtn')) el('teacherSubmitBtn').textContent = 'শিক্ষক যোগ করুন';
    } else {
      setTeachers([...teachers, teacher]);
    }
    e.target.reset();
    renderTeachers();
    showToast('শিক্ষক যোগ করা হয়েছে।', 'success');
  });

  el('teacherTableBody')?.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-teacher-edit]');
    if (editButton) {
      const index = Number(editButton.dataset.teacherEdit);
      const teacher = getTeachers()[index];
      if (!teacher) return;
      teacherEditIndex = index;
      const form = el('teacherForm');
      form.elements.name.value = teacher.name || '';
      form.elements.designation.value = teacher.designation || '';
      form.elements.mobile.value = teacher.mobile || '';
      if (el('teacherSubmitBtn')) el('teacherSubmitBtn').textContent = 'শিক্ষক আপডেট করুন';
      return;
    }
    const button = event.target.closest('[data-teacher-delete]');
    if (!button) return;
    const index = Number(button.dataset.teacherDelete);
    if (!confirm('আপনি কি এই শিক্ষককে মুছে ফেলতে চান?')) return;
    setTeachers(getTeachers().filter((_, i) => i !== index));
    renderTeachers();
    showToast('শিক্ষক মুছে ফেলা হয়েছে।', 'success');
  });

  el('studentTableBody')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-student-edit]');
    if (!button) return;
    const id = button.dataset.studentEdit;
    const student = getStudents().find((item) => item.id === id);
    if (!student) return;
    studentEditId = id;
    const form = el('studentForm');
    Object.entries(student).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value || '';
    });
    if (el('studentSubmitBtn')) el('studentSubmitBtn').textContent = 'শিক্ষার্থী আপডেট করুন';
    showToast('শিক্ষার্থী তথ্য এডিট মোডে লোড হয়েছে।', 'info');
  });

  el('configForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const config = Object.fromEntries(new FormData(e.target).entries());
    config.showLogo = el('cfgShowLogo')?.checked;
    config.toggleSchoolInfo = el('cfgToggleSchoolInfo')?.checked;
    config.toggleGuardian = el('cfgToggleGuardian')?.checked;
    config.toggleInstructions = el('cfgToggleInstructions')?.checked;
    config.toggleTeacherSign = el('cfgToggleTeacherSign')?.checked;
    config.toggleFooter = el('cfgToggleFooter')?.checked;
    config.classes = (config.classes || '').split(',').map((item) => item.trim()).filter(Boolean).join(', ');
    config.examList = (config.examList || '').split(',').map((item) => item.trim()).filter(Boolean).join(', ');
    config.subjectList = (config.subjectList || '').split(',').map((item) => item.trim()).filter(Boolean).join(', ');
    setConfig(config);
    populateClassSelects();
    populateExamOptions();
    renderMarksFields();
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

  el('leaveForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const item = Object.fromEntries(new FormData(e.target).entries());
    if (!item.teacher) return showToast('শিক্ষক নির্বাচন করুন।', 'error');
    setLeaves([...getLeaves(), item]);
    e.target.reset();
    renderLeaveTable();
    showToast('ছুটি আবেদন সংরক্ষিত হয়েছে।', 'success');
  });

  el('leaveTableBody')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-leave-delete]');
    if (!button) return;
    const index = Number(button.dataset.leaveDelete);
    if (!confirm('এই ছুটি আবেদন মুছে ফেলতে চান?')) return;
    setLeaves(getLeaves().filter((_, i) => i !== index));
    renderLeaveTable();
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
    if ((type === 'progress' || type === 'marksheet') && student && !hasMarks(student)) {
      showToast('নম্বর এন্ট্রি না থাকায় নম্বর ০ ধরা হবে।', 'info');
    }
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

function initOfficialPad() {
  if (!el('officialPadOutput')) return;
  el('previewPadBtn')?.addEventListener('click', renderOfficialPad);
  el('printPadBtn')?.addEventListener('click', () => {
    renderOfficialPad();
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
  if (el('cfgClasses')) el('cfgClasses').value = config.classes || 'Class 1, Class 2, Class 3, Class 4, Class 5';
  if (el('cfgExamName')) el('cfgExamName').value = config.examName || 'বার্ষিক মূল্যায়ন';
  if (el('cfgExamList')) el('cfgExamList').value = config.examList || '১ম সাময়িক, ২য় সাময়িক, বার্ষিক মূল্যায়ন';
  if (el('cfgSubjectList')) el('cfgSubjectList').value = config.subjectList || 'বাংলা, ইংরেজি, গণিত, বিজ্ঞান, ধর্ম';
  if (el('cfgCenterName')) el('cfgCenterName').value = config.centerName || 'মেইন ক্যাম্পাস হল';
  if (el('cfgFooterNote')) el('cfgFooterNote').value = config.footerNote || 'স্কুল ম্যানেজমেন্ট পোর্টাল দ্বারা প্রস্তুত';
  if (el('cfgAdmitInstructions')) el('cfgAdmitInstructions').value = config.admitInstructions || 'অ্যাডমিট কার্ড সঙ্গে আনতে হবে।';
  if (el('cfgSeatInstructions')) el('cfgSeatInstructions').value = config.seatInstructions || '৩০ মিনিট আগে কেন্দ্রে উপস্থিত হতে হবে।';
  if (el('cfgProgressComment')) el('cfgProgressComment').value = config.progressComment || 'আরও ভালো করার চেষ্টা করো।';
  if (el('cfgMarksheetComment')) el('cfgMarksheetComment').value = config.marksheetComment || 'পরবর্তী শ্রেণিতে উত্তীর্ণ।';
  if (el('cfgToggleSchoolInfo')) el('cfgToggleSchoolInfo').checked = config.toggleSchoolInfo !== false;
  if (el('cfgToggleGuardian')) el('cfgToggleGuardian').checked = config.toggleGuardian !== false;
  if (el('cfgToggleInstructions')) el('cfgToggleInstructions').checked = config.toggleInstructions !== false;
  if (el('cfgToggleTeacherSign')) el('cfgToggleTeacherSign').checked = config.toggleTeacherSign !== false;
  if (el('cfgToggleFooter')) el('cfgToggleFooter').checked = config.toggleFooter !== false;
  if (el('cfgShowLogo')) el('cfgShowLogo').checked = config.showLogo !== false;

  if (el('optExamName')) {
    populateExamOptions();
    el('optExamName').value = config.examName || getExamList()[0];
  }
  if (el('optCenterName')) el('optCenterName').value = config.centerName || 'মেইন ক্যাম্পাস হল';
  if (el('optFooterNote')) el('optFooterNote').value = config.footerNote || 'স্কুল ম্যানেজমেন্ট পোর্টাল দ্বারা প্রস্তুত';
  if (el('optAdmitInstructions')) el('optAdmitInstructions').value = config.admitInstructions || 'অ্যাডমিট কার্ড সঙ্গে আনতে হবে।';
  if (el('optSeatInstructions')) el('optSeatInstructions').value = config.seatInstructions || '৩০ মিনিট আগে কেন্দ্রে উপস্থিত হতে হবে।';
  if (el('optProgressComment')) el('optProgressComment').value = config.progressComment || 'আরও ভালো করার চেষ্টা করো।';
  if (el('optMarksheetComment')) el('optMarksheetComment').value = config.marksheetComment || 'পরবর্তী শ্রেণিতে উত্তীর্ণ।';
  if (el('toggleSchoolInfo')) el('toggleSchoolInfo').checked = config.toggleSchoolInfo !== false;
  if (el('toggleGuardian')) el('toggleGuardian').checked = config.toggleGuardian !== false;
  if (el('toggleInstructions')) el('toggleInstructions').checked = config.toggleInstructions !== false;
  if (el('toggleTeacherSign')) el('toggleTeacherSign').checked = config.toggleTeacherSign !== false;
  if (el('toggleFooter')) el('toggleFooter').checked = config.toggleFooter !== false;
}

loadSettings();
populateClassSelects();
renderMarksFields();
setActiveMenu();
renderTeachers();
renderLeaveTable();
populateStudentSelectors();
refreshStudentTable();
renderDashboard();
initForms();
initDashboardTransfer();
initDocuments();
initOfficialPad();
renderRoutineTable();
