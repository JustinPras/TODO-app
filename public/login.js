document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
  
    if (token) {
      location.href = "todo.html";
    }
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await login();
});

async function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
      const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
      const data = await res.json();
      throw new Error(`Failed to create user: ${data.error}`);
      }
      console.log('User created!');
      await login();
  } catch (error) {
      alert(`Error: ${error.message}`);
  }
}  
  
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(`Failed to login: ${data.error}`);
    }

    if (data.token) {
        localStorage.setItem('token', data.token);
        location.href = "todo.html";
    } else {
        alert('Login failed. Please check your credentials.');
    }
    } catch (error) {
    alert(`Error: ${error.message}`);
    }
}