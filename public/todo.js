document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
  
    if (!token) {
      location.href = 'index.html';
      return;
    } else {
      await getTasks();
    }
});

document.getElementById('task-create-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  await createTask();
});

async function createTask() {
  const body = document.getElementById('task-create')
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
    
    const modal = document.querySelector(".modal.active");
    closeModal(modal);

    if (taskID) {
      await getTasks();
    }
    console.log("Newly created task has completion status: ", data.completed);
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
  console.log("Task created successfully: ", bodyValue)
}
  
function logout() {
    localStorage.removeItem('token');
    location.href = "index.html";
}

async function getTasks() {
  try {
    const res = await fetch('/api/tasks', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Failed to get tasks. Error: ${data.error}`);
    }

    const tasks = data;
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

      const leftWrapper = document.createElement('div');
      leftWrapper.classList.add("left-wrapper");

      const text = document.createElement('span');
      text.classList.add('task-text');
      text.textContent = task.body;

      const rightWrapper = document.createElement('div');
      rightWrapper.classList.add('right-wrapper');

      const editBtn = document.createElement('button');
      editBtn.classList.add('edit-task');
      editBtn.dataset.modalTarget = "#modal-edit-task-"+task.id;
      editBtn.textContent = 'Edit';

      const modal = document.createElement("div");
      modal.classList.add("modal");
      modal.id = "modal-edit-task-"+task.id;

      const modalHeader = document.createElement('div');
      modalHeader.classList.add("modal-header");
      
      const title = document.createElement("div");
      title.classList.add("title");
      title.textContent = "Edit Task";
      
      const closeButton = document.createElement("button");
      closeButton.setAttribute("data-close-button", "");
      closeButton.classList.add("close-button");
      closeButton.innerHTML = "&times;";

      modalHeader.append(title);
      modalHeader.append(closeButton);

      const modalBody = document.createElement("div");
      modalBody.classList.add("modal-body");
      
      const taskForm = document.createElement("form");
      taskForm.id = "task-edit-form"+task.id;
      
      const taskInputArea = document.createElement("textarea");
      taskInputArea.classList.add("task-input-area");
      taskInputArea.id = "task-edit-"+task.id;
      taskInputArea.placeholder = task.body;
      taskInputArea.required = true;

      taskForm.append(taskInputArea);
      
      const buttonContainer = document.createElement("div");
      buttonContainer.classList.add("button-container");

      const confirmButton = document.createElement("button");
      confirmButton.classList.add("confirm-edit-button");
      confirmButton.textContent = "Confirm Edit";

      buttonContainer.append(confirmButton);

      modalBody.append(taskForm);
      modalBody.append(buttonContainer);

      modal.append(modalHeader);
      modal.append(modalBody);

      editBtn.append(modal);

      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('delete-task');
      deleteBtn.textContent = 'Delete';
      
      leftWrapper.append(statusCircle);
      leftWrapper.append(text);

      rightWrapper.append(editBtn);
      rightWrapper.append(deleteBtn);


      listItem.append(leftWrapper);
      listItem.append(rightWrapper);
      
      listItem.dataset.taskId = task.id;
      taskList.appendChild(listItem);  
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

addGlobalClassEventListener("click", "task-item", async e => {
  const taskItem = e.target;
  const taskID = taskItem.dataset.taskId;
  const task = await getTask(taskID);
  console.log("Task completed: ", task.completed);
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
    const data = await res.json();
    console.log("Task completion status after PATCH request: ", data.completed);
    await getTasks();
  } catch (err) {
    alert(err.message);
  }
});

addGlobalClassEventListener("click", "confirm-edit-button", e => {
  const modalBody = e.target.closest(".modal-body");
  const taskEditForm = modalBody.firstChild;
  const body = taskEditForm.firstChild;
  const taskID = body.id.replace("task-edit-", "");
  const bodyValue = body.value;
  editTask(taskID, bodyValue);
  const modal = document.querySelector(".modal.active");
  closeModal(modal);
});

async function editTask(taskID, newBody) {
  try {
    const res = await fetch(`/api/tasks/${taskID}`, {
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
    await getTasks();
  } catch(error) {
    alert(`Error: ${error.message}`);
  }
}

addGlobalClassEventListener("click", "edit-task", e => {
  e.stopPropagation();
  const modal = document.querySelector(e.target.dataset.modalTarget);
  openModal(modal);
});

addGlobalClassEventListener("click", "delete-task", e => {
  const taskItem = e.target.closest(".task-item");
  const taskID = taskItem.dataset.taskId;
  taskItem.remove();
  deleteTask(taskID);
})

function addGlobalClassEventListener(type, className, callback) {
  document.addEventListener(type, e => {
    if (e.target.classList.contains(className)) callback(e);
  });
}

async function deleteTask(taskID) {
  try {
    const res = await fetch(`/api/tasks/${taskID}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!res.ok) {
      throw new Error("Failed to delete task.");
    }
    console.log("Task deleted successfully!");
    await getTasks();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

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
    return task;
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

const openModalButtons = document.querySelectorAll("[data-modal-target]");
const closeModalButtons = document.querySelectorAll("[data-close-button]");
const overlay = document.getElementById("overlay");

openModalButtons.forEach(button => {
  button.addEventListener("click", () => {
    const modal = document.querySelector(button.dataset.modalTarget);
    openModal(modal);
  })
})

overlay.addEventListener("click", () => {
  const modals = document.querySelectorAll(".modal.active");
  modals.forEach(modal => {
    closeModal(modal);
  })
})

closeModalButtons.forEach(button => {
  button.addEventListener("click", () => {
    const modal = button.closest(".modal");
    closeModal(modal);
  })
})

function openModal(modal) {
  if (modal == null) {
    return;
  }
  modal.classList.add("active");
  overlay.classList.add("active");
}

function closeModal(modal) {
  if (modal == null) {
    console.log("null modal to close")
    return;
  }
  modal.classList.remove("active");
  overlay.classList.remove("active");
}