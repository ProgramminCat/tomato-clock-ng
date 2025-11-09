import browser from "webextension-polyfill";
import { STORAGE_KEY } from "./constants";

export default class Tasks {
  constructor() {
    this.storage = browser.storage.local;
  }

  async getTasks() {
    const result = await this.storage.get(STORAGE_KEY.TASKS);
    return result[STORAGE_KEY.TASKS] || [];
  }

  async saveTasks(tasks) {
    await this.storage.set({ [STORAGE_KEY.TASKS]: tasks });
  }

  async addTask(taskName, description = "") {
    const tasks = await this.getTasks();
    const newTask = {
      id: Date.now().toString(),
      name: taskName,
      description: description,
      completed: false,
      createdAt: new Date().toISOString(),
      tomatoCount: 0,
      totalMinutes: 0,
    };
    tasks.push(newTask);
    await this.saveTasks(tasks);
    return newTask;
  }

  async updateTask(taskId, updates) {
    const tasks = await this.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
      await this.saveTasks(tasks);
      return tasks[taskIndex];
    }
    return null;
  }

  async deleteTask(taskId) {
    const tasks = await this.getTasks();
    const filteredTasks = tasks.filter((t) => t.id !== taskId);
    await this.saveTasks(filteredTasks);
  }

  async toggleTaskComplete(taskId) {
    const tasks = await this.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].completed = !tasks[taskIndex].completed;
      await this.saveTasks(tasks);
      return tasks[taskIndex];
    }
    return null;
  }

  async getTaskById(taskId) {
    const tasks = await this.getTasks();
    return tasks.find((t) => t.id === taskId);
  }

  async incrementTaskStats(taskId, durationMinutes) {
    const tasks = await this.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].tomatoCount = (tasks[taskIndex].tomatoCount || 0) + 1;
      tasks[taskIndex].totalMinutes = (tasks[taskIndex].totalMinutes || 0) + durationMinutes;
      await this.saveTasks(tasks);
      return tasks[taskIndex];
    }
    return null;
  }

  async getActiveTasks() {
    const tasks = await this.getTasks();
    return tasks.filter((t) => !t.completed);
  }

  async getCompletedTasks() {
    const tasks = await this.getTasks();
    return tasks.filter((t) => t.completed);
  }
}
