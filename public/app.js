document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
  
    if (token) {
      document.getElementById('auth-section').style.display = 'none';
      document.getElementById('task-section').style.display = 'block';
    } else {
      document.getElementById('auth-section').style.display = 'block';
      document.getElementById('task-section').style.display = 'none';
    }
});

document.getElementById('task-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await createTask();
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await login();
});

async function createTask() {
    const title = document.getElementById('task').value;
    const description = document.getElementById('task-due-date').value;
  
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(`Failed to create task: ${data.error}`);
      }
  
      const taskID = data.id;
      if (taskID) {
        await getTasks();
        await taskStateHandler(taskID);
      }
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
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('task-section').style.display = 'block';
        await getTasks();
    } else {
        alert('Login failed. Please check your credentials.');
    }
    } catch (error) {
    alert(`Error: ${error.message}`);
    }
}
  
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
  
function logout() {
    localStorage.removeItem('token');
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('task-section').style.display = 'none';
}

const taskStateHandler = createTaskStateHandler();

async function getTasks() {
  try {
    const res = await fetch('/api/tasks', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(`Failed to get tasks. Error: ${data.error}`);
    }

    const tasks = await res.json();
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    for (const task of tasks) {
      const listItem = document.createElement('li');
      listItem.textContent = task.title;
      listItem.onclick = () => taskStateHandler(task.id);
      taskList.appendChild(listItem);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

function createTaskStateHandler() {
  let currentTaskID = null;

  return async function handleTaskClick(taskID) {
    if (currentTaskID !== taskID) {
      currentTaskID = taskID;

      await getTask(taskID);
    }
  };
}

let currentTask = null;

async function getTask(taskID) {
  try {
    const res = await fetch(`/api/tasks/${taskID}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!res.ok) {
      throw new Error('Failed to get task.');
    }

    const task = await res.json();
    currentTask = task;
    // viewTask(task);
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function deleteTask() {
  if (!currentTask) {
    alert('No task selected for deletion.');
    return;
  }

  try {
    const res = await fetch(`/api/tasks/${currentTask.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!res.ok) {
      throw new Error('Failed to delete task.');
    }
    alert('Task deleted successfully.');
    document.getElementById('task-display').style.display = 'none';
    await getTasks();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}