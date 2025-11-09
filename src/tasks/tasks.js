import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./tasks.css";

import Tasks from "../utils/tasks";
import Timeline from "../utils/timeline";
import Settings from "../utils/settings";
import { TIMER_TYPE } from "../utils/constants";

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "timer-finished") {
    window.location.reload();
  }
});

export default class TasksPage {
  constructor() {
    this.tasks = new Tasks();
    this.timeline = new Timeline();
    this.settings = new Settings();

    this.addTaskForm = document.getElementById("add-task-form");
    this.taskNameInput = document.getElementById("task-name-input");
    this.taskDescriptionInput = document.getElementById(
      "task-description-input",
    );

    this.activeTasksList = document.getElementById("active-tasks-list");
    this.completedTasksList = document.getElementById("completed-tasks-list");
    this.taskStatsTableBody = document.getElementById("task-stats-table-body");

    this.editTaskModal = document.getElementById("edit-task-modal");
    this.editTaskForm = document.getElementById("edit-task-form");
    this.editTaskId = document.getElementById("edit-task-id");
    this.editTaskName = document.getElementById("edit-task-name");
    this.editTaskDescription = document.getElementById("edit-task-description");
    this.saveTaskEditButton = document.getElementById("save-task-edit");

    this.setEventListeners();
    this.loadAllTasks();
    this.loadTaskStats();
    this.applyDarkMode();

    // Listen for settings changes to update dark mode
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync" || areaName === "local") {
        if (changes.settings) {
          this.applyDarkMode();
        }
      }
    });
  }

  async applyDarkMode() {
    const settings = await this.settings.getSettings();

    if (settings.isDarkModeEnabled) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  setEventListeners() {
    // Add task form
    this.addTaskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleAddTask();
    });

    // Save edit button
    this.saveTaskEditButton.addEventListener("click", () => {
      this.handleSaveTaskEdit();
    });

    // Tab navigation
    $('a[data-toggle="tab"]').on("shown.bs.tab", (e) => {
      const target = $(e.target).attr("href");
      if (target === "#task-stats") {
        this.loadTaskStats();
      }
    });
  }

  async handleAddTask() {
    const taskName = this.taskNameInput.value.trim();
    const taskDescription = this.taskDescriptionInput.value.trim();

    if (!taskName) {
      alert("Please enter a task name");
      return;
    }

    try {
      await this.tasks.addTask(taskName, taskDescription);
      this.taskNameInput.value = "";
      this.taskDescriptionInput.value = "";
      this.loadAllTasks();
      this.loadTaskStats();
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task. Please try again.");
    }
  }

  async loadAllTasks() {
    await this.loadActiveTasks();
    await this.loadCompletedTasks();
  }

  async loadActiveTasks() {
    const activeTasks = await this.tasks.getActiveTasks();
    this.renderTaskList(activeTasks, this.activeTasksList, false);
  }

  async loadCompletedTasks() {
    const completedTasks = await this.tasks.getCompletedTasks();
    this.renderTaskList(completedTasks, this.completedTasksList, true);
  }

  renderTaskList(tasks, container, isCompleted) {
    container.innerHTML = "";

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${isCompleted ? "✓" : "📝"}</div>
          <div class="empty-state-text">
            ${isCompleted ? "No completed tasks yet" : "No active tasks. Add one above to get started!"}
          </div>
        </div>
      `;
      return;
    }

    tasks.forEach((task) => {
      const taskElement = this.createTaskElement(task, isCompleted);
      container.appendChild(taskElement);
    });
  }

  createTaskElement(task, isCompleted) {
    const taskDiv = document.createElement("div");
    taskDiv.className = `task-item ${isCompleted ? "completed" : ""}`;
    taskDiv.dataset.taskId = task.id;

    const createdDate = new Date(task.createdAt).toLocaleDateString();
    const tomatoCount = task.tomatoCount || 0;
    const totalMinutes = (task.totalMinutes || 0).toFixed(1);

    taskDiv.innerHTML = `
      <div class="task-header">
        <h5 class="task-title">${this.escapeHtml(task.name)}</h5>
      </div>
      <div class="task-stats">
        <div class="task-stat-item">
          <span>🍅</span>
          <span class="badge badge-danger">${tomatoCount}</span>
          <span>Tomatoes</span>
        </div>
        <div class="task-stat-item">
          <span>⏱️</span>
          <span class="badge badge-secondary">${totalMinutes}</span>
          <span>Minutes</span>
        </div>
      </div>
      ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ""}
      <div class="task-actions">
        <button class="btn btn-sm btn-${isCompleted ? "success" : "outline-success"} toggle-complete-btn">
          ${isCompleted ? "Reopen" : "Complete"}
        </button>
        <button class="btn btn-sm btn-outline-primary edit-task-btn">
          Edit
        </button>
        <button class="btn btn-sm btn-outline-danger delete-task-btn">
          Delete
        </button>
      </div>
      <div class="task-metadata">
        Created: ${createdDate}
      </div>
    `;

    // Add event listeners
    const toggleBtn = taskDiv.querySelector(".toggle-complete-btn");
    const editBtn = taskDiv.querySelector(".edit-task-btn");
    const deleteBtn = taskDiv.querySelector(".delete-task-btn");

    toggleBtn.addEventListener("click", () =>
      this.handleToggleComplete(task.id),
    );
    editBtn.addEventListener("click", () => this.handleEditTask(task));
    deleteBtn.addEventListener("click", () =>
      this.handleDeleteTask(task.id, task.name),
    );

    return taskDiv;
  }

  async handleToggleComplete(taskId) {
    try {
      await this.tasks.toggleTaskComplete(taskId);
      this.loadAllTasks();
      this.loadTaskStats();
    } catch (error) {
      console.error("Error toggling task:", error);
      alert("Failed to update task. Please try again.");
    }
  }

  handleEditTask(task) {
    this.editTaskId.value = task.id;
    this.editTaskName.value = task.name;
    this.editTaskDescription.value = task.description || "";
    $("#edit-task-modal").modal("show");
  }

  async handleSaveTaskEdit() {
    const taskId = this.editTaskId.value;
    const name = this.editTaskName.value.trim();
    const description = this.editTaskDescription.value.trim();

    if (!name) {
      alert("Please enter a task name");
      return;
    }

    try {
      await this.tasks.updateTask(taskId, { name, description });
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("edit-task-modal"),
      );
      if (modal) modal.hide();
      this.loadAllTasks();
      this.loadTaskStats();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task. Please try again.");
    }
  }

  async handleDeleteTask(taskId, taskName) {
    const confirmed = confirm(
      `Are you sure you want to delete "${taskName}"?\n\nThis will not delete the tomato records associated with this task.`,
    );

    if (confirmed) {
      try {
        await this.tasks.deleteTask(taskId);
        this.loadAllTasks();
        this.loadTaskStats();
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("Failed to delete task. Please try again.");
      }
    }
  }

  async loadTaskStats() {
    if (!this.taskStatsTableBody) {
      console.error("Task stats table body not found");
      return;
    }

    const allTasks = await this.tasks.getTasks();
    console.log("Loading task stats, found tasks:", allTasks);

    // Sort tasks by tomato count descending
    allTasks.sort((a, b) => (b.tomatoCount || 0) - (a.tomatoCount || 0));

    this.taskStatsTableBody.innerHTML = "";

    if (allTasks.length === 0) {
      console.log("No tasks to display in stats");
      this.taskStatsTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center" style="padding: 40px;">
            No tasks yet. Create a task to start tracking your progress!
          </td>
        </tr>
      `;
      return;
    }

    console.log("Rendering", allTasks.length, "tasks in stats table");
    allTasks.forEach((task) => {
      const row = document.createElement("tr");
      const createdDate = new Date(task.createdAt).toLocaleDateString();
      const status = task.completed ? "Completed" : "Active";
      const statusClass = task.completed ? "badge-success" : "badge-primary";
      const tomatoCount = task.tomatoCount || 0;
      const totalMinutes = (task.totalMinutes || 0).toFixed(1);

      row.innerHTML = `
        <td>${this.escapeHtml(task.name)}</td>
        <td><span class="badge ${statusClass}">${status}</span></td>
        <td class="stat-highlight">${tomatoCount}</td>
        <td class="stat-highlight">${totalMinutes}</td>
        <td>${createdDate}</td>
      `;

      this.taskStatsTableBody.appendChild(row);
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

$(document).ready(() => {
  new TasksPage();
});
