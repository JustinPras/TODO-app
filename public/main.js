document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
  
    if (token) {
      await getTasks();
      
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
  const body = document.getElementById('task')
  const bodyValue = body.value;
  
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ body: bodyValue }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Failed to create task: ${data.error}`);
    }

    body.value = '';
    const taskID = data.id;
    if (taskID) {
      await getTasks();
      await taskStateHandler(taskID);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
  console.log("Task created successfully: ", bodyValue)
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
    resetTaskSelection()
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
      listItem.classList.add('task-item');
      const statusCircle = document.createElement('span');
      statusCircle.classList.add('status-circle');
      if (task.completed) {
        statusCircle.classList.add('completed');
        listItem.classList.add('completed');
      }

      statusCircle.onclick = async (e) => {
        e.stopPropagation();

        try {
          const res = await fetch(`/api/tasks/${task.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ completed: !task.completed }),
          });

          if (!res.ok) {
            throw new Error('Failed to update task status.');
          }
          await getTasks();
        } catch (err) {
          alert(err.message);
        }
      };

      const text = document.createElement('span');
      text.textContent = task.body;

      listItem.appendChild(statusCircle);
      listItem.appendChild(text);

      listItem.onclick = () => {
        const items = taskList.querySelectorAll('li');
        items.forEach(item => item.classList.remove('selected'));
        listItem.classList.add('selected');

        taskStateHandler(task.id);
      };

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
      editTaskBtn.disabled = false;
      deleteTaskBtn.disabled = false;
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
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

const editTaskBtn = document.getElementById('edit-task-btn');
const deleteTaskBtn = document.getElementById('delete-task-btn');
const editTaskContainer = document.getElementById('edit-task-container');
const editTaskInput = document.getElementById('edit-task-input');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const confirmEditBtn = document.getElementById('confirm-edit-btn');

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
    console.log("Task deleted successfully!")
    currentTask = null;
    await getTasks();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function editTask() {
  if (!currentTask) {
    alert('No task selected to edit.');
    return;
  }

  editTaskInput.value = currentTask.body;
  editTaskContainer.style.display = 'block';

  cancelEditBtn.onclick = () => {
    editTaskInput.value = '';
    editTaskContainer.style.display = 'none';
  };

  confirmEditBtn.onclick = async () => {
    const newBody = editTaskInput.value;
    if (!newBody || !currentTask) return;

    try {
      const res = await fetch(`/api/tasks/${currentTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ body: newBody }),
      });
      if (!res.ok) {
        throw new Error('Failed to edit task.');
      }
      editTaskContainer.style.display = 'none';
      editTaskInput.value = '';
      await getTasks();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
}

function resetTaskSelection() {
  currentTask = null;
  editTaskBtn.disabled = true;
  deleteTaskBtn.disabled = true;
}