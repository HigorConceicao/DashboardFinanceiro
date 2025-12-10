// --- Elementos DOM ---
const btnLoginTab = document.getElementById('btnLogin');
const btnRegisterTab = document.getElementById('btnRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');

btnLoginTab.addEventListener('click', () => {
  loginForm.classList.add('active');
  registerForm.classList.remove('active');
  btnLoginTab.classList.add('active');
  btnRegisterTab.classList.remove('active');
});

btnRegisterTab.addEventListener('click', () => {
  registerForm.classList.add('active');
  loginForm.classList.remove('active');
  btnRegisterTab.classList.add('active');
  btnLoginTab.classList.remove('active');
});

// --- Funções auxiliares ---
function getUsers() {
  return JSON.parse(localStorage.getItem('users')) || [];
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

// --- Cadastro ---
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('regUser').value.trim();
  const password = document.getElementById('regPass').value;

  const users = getUsers();
  if (users.find(u => u.username === username)) {
    registerError.textContent = 'Usuário já existe!';
    return;
  }

  users.push({ username, password });
  saveUsers(users);
  registerError.textContent = 'Usuário cadastrado com sucesso!';
  registerForm.reset();
});

// --- Login ---
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;

  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    localStorage.setItem('loggedUser', username);
    window.location.href = 'SaoLuis.html';
  } else {
    loginError.textContent = 'Usuário ou senha incorretos!';
  }
});
