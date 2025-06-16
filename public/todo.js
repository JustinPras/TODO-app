document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
  
    if (!token) {
      location.href = 'index.html';
      return;
    } else {
      await getTasks();
    }
});

document.getElementById('task-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  await createTask();
});

document.getElementById('task-edit-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  await editTask();
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
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
  console.log("Task created successfully: ", bodyValue)
}
  
function logout() {
    localStorage.removeItem('token');
    location.href = "index.html";
    resetTaskSelection()
}

const taskStateHandler = createTaskStateHandler();

async function getTasks() {
  resetTaskSelection()
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
    console.log("Task deleted successfully!")
    currentTask = null;
    await getTasks();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

const editTaskBtn = document.getElementById('edit-task-btn');
const deleteTaskBtn = document.getElementById('delete-task-btn');
const editTaskContainer = document.getElementById('edit-task-container');
const editTaskInput = document.getElementById('edit-task-input');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

async function showEditTaskForm() {
  if (!currentTask) {
    alert('No task selected to edit.');
    return;
  }

  editTaskInput.value = currentTask.body;
  editTaskContainer.style.display = 'block';

  cancelEditBtn.onclick = () => {
    editTaskInput.value = '';
    editTaskContainer.style.display = 'none';
    resetTaskSelection()
  };
}

async function editTask() {
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

function resetTaskSelection() {
  currentTask = null;
  editTaskBtn.disabled = true;
  deleteTaskBtn.disabled = true;
}