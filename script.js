// Автоматически выполняемая анонимная функция
(function() {
  // Основной класс приложения
  class TodoApp {
    // Конструктор вызывается при создании
    constructor() {
      // Состояние
      this.tasks = []; // основной массив: id, title, date, completed
      this.filter = 'all'; // какой тип значений отображать: all, active, completed
      this.sortOrder = 'asc'; // порядок сортировки по дате: asc или desc
      this.searchQuery = ''; // запрос для поиска по подстроке 
      this.editingId = null; // id редактируемой задачи или null

      // DOM элементы
      this.elements = {
        form: null, // ссылка на форму добавления/редактирования
        titleInput: null, // на название задачи
        dateInput: null, // на дату задачи
        submitBtn: null, // на кнопку отправки формы (добавить или обновить)
        cancelBtn: null, // на кнопку отмены при редактировании
        searchInput: null, // на поле поиска по подстроке
        filterSelect: null, // на выпадающий список при выборе фильтра
        sortBtn: null, // на кнопку сортировки
        taskList: null // на контейнер для рендеринга задач
      };
    }

    // Инициализация: создание структуры, загрузка данных, рендеринг
    init() {
      this.injectStyles(); // Добавить CSS в <head>
      this.createStructure(); // Построить HTML
      this.loadFromLocalStorage(); // Загрузка задачи
      if (this.tasks.length === 0) {
        this.addDemoTasks(); // Добавляем демо-задачи при первом запуске
      }
      this.render(); // Отрисовка списка
      this.attachEvents(); // Вешаем обработчики
    }

    // Вставка CSS правил через <style>
    injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        /* Основной блок */
        body {
          font-family: Arial, sans-serif;
          background: #f4f4f4;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          padding: 16px;
        }
        .todo-app {
          max-width: 800px;
          width: 100%;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          padding: 24px;
        }
        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 24px;
        }
        /* Форма добавления/редактирования */
        .form {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 24px;
        }
        .form input[type="text"],
        .form input[type="date"] {
          flex: 1 1 200px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        .form button {
          padding: 10px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.2s;
        }
        .form button:hover {
          background: #0056b3;
        }
        .form button#cancel-btn {
          background: #6c757d;
        }
        .form button#cancel-btn:hover {
          background: #5a6268;
        }
        /* Панель управления */
        .controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 24px;
        }
        .controls input,
        .controls select,
        .controls button {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        .controls input {
          flex: 2 1 250px;
        }
        .controls select {
          flex: 1 1 150px;
        }
        .controls button {
          background: #28a745;
          color: white;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .controls button:hover {
          background: #218838;
        }
        /* Список задач */
        .task-list {
          list-style: none;
          margin-top: 16px;
        }
        .task {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f9f9f9;
          border: 1px solid #eee;
          border-radius: 4px;
          margin-bottom: 8px;
          transition: background 0.2s;
          cursor: grab;
        }
        .task.dragging {
          opacity: 0.5;
          cursor: grabbing;
        }
        .task--completed {
          background: #e0ffe0;
          text-decoration: line-through;
          color: #666;
        }
        .task__checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        .task__title {
          flex: 1 1 200px;
          font-size: 16px;
          word-break: break-word;
        }
        .task__date {
          font-size: 14px;
          color: #666;
          background: #e9ecef;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .task__actions {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }
        .task__actions button {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        .task__edit {
          background: #ffc107;
          color: #333;
        }
        .task__edit:hover {
          background: #e0a800;
        }
        .task__delete {
          background: #dc3545;
          color: white;
        }
        .task__delete:hover {
          background: #c82333;
        }
        /* Адаптивность */
        @media (max-width: 600px) {
          .form {
            flex-direction: column;
          }
          .controls {
            flex-direction: column;
          }
          .task {
            flex-direction: column;
            align-items: flex-start;
          }
          .task__actions {
            margin-left: 0;
            width: 100%;
            justify-content: flex-end;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Создание базовой структуры (без задач)
    createStructure() {
      // Общий объекта для группировки
      const app = document.createElement('div');
      app.className = 'todo-app';

      // Заголовок
      const title = document.createElement('h1');
      title.textContent = 'Мой ToDo-лист';
      app.appendChild(title);

      // Форма
      const form = document.createElement('form');
      form.className = 'form';
      form.id = 'todo-form';

      // Название задачи (поле ввода)
      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.placeholder = 'Название задачи';
      titleInput.required = true;
      titleInput.id = 'title-input';

      // Дата задачи (поле выбора)
      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.required = true;
      dateInput.id = 'date-input';
      // Установка текущей даты по умолчанию
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;

      // Кнопка отправки
      const submitBtn = document.createElement('button');
      submitBtn.type = 'submit';
      submitBtn.textContent = 'Добавить';
      submitBtn.id = 'submit-btn';
      
      // Кнопка отмены
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Отмена';
      cancelBtn.id = 'cancel-btn';
      cancelBtn.style.display = 'none'; // Скрыта по умолчанию

      form.appendChild(titleInput);
      form.appendChild(dateInput);
      form.appendChild(submitBtn);
      form.appendChild(cancelBtn);
      app.appendChild(form);

      // Панель управления
      const controls = document.createElement('div');
      controls.className = 'controls';

      // Поле ввода для поиска по подстроке
      const searchInput = document.createElement('input');
      searchInput.type = 'search';
      searchInput.placeholder = 'Поиск по названию...';
      searchInput.id = 'search-input';

      // Выбор фильтра из выпадающего списка
      const filterSelect = document.createElement('select');
      filterSelect.id = 'filter-select';
      const options = [
        { value: 'all', text: 'Все' },
        { value: 'active', text: 'Активные' },
        { value: 'completed', text: 'Выполненные' }
      ];
      // Заполнение
      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        filterSelect.appendChild(option);
      });

      // Кнопка сортировки
      const sortBtn = document.createElement('button');
      sortBtn.id = 'sort-btn';
      sortBtn.textContent = 'Сортировать по дате ↑';

      controls.appendChild(searchInput);
      controls.appendChild(filterSelect);
      controls.appendChild(sortBtn);
      app.appendChild(controls);

      // Контейнер для списка задач (DOM-элемент)
      const taskList = document.createElement('ul');
      taskList.className = 'task-list';
      taskList.id = 'task-list';
      app.appendChild(taskList);

      document.body.appendChild(app);

      // Сохранение ссылок на созданные элементы
      this.elements.form = form;
      this.elements.titleInput = titleInput;
      this.elements.dateInput = dateInput;
      this.elements.submitBtn = submitBtn;
      this.elements.cancelBtn = cancelBtn;
      this.elements.searchInput = searchInput;
      this.elements.filterSelect = filterSelect;
      this.elements.sortBtn = sortBtn;
      this.elements.taskList = taskList;
    }

    // Загрузка из localStorage (нужно для перезагрузки)
    loadFromLocalStorage() {
      const stored = localStorage.getItem('todoAppTasks');
      if (stored) {
        try {
          this.tasks = JSON.parse(stored);
        } catch (e) {
          console.error('Ошибка загрузки из localStorage', e);
          this.tasks = [];
        }
      }
    }

    // Сохранение в localStorage
    saveToLocalStorage() {
      localStorage.setItem('todoAppTasks', JSON.stringify(this.tasks));
    }

    // Добавление задач для примера
    addDemoTasks() {
      const demo = [
        { id: Date.now() + 1, title: 'Купить продукты', date: '2026-03-10', completed: false },
        { id: Date.now() + 2, title: 'Сделать зарядку', date: '2026-03-09', completed: true },
        { id: Date.now() + 3, title: 'Прочитать книгу', date: '2026-03-11', completed: false }
      ];
      // Сохраняем в массив и localStorage
      this.tasks.push(...demo);
      this.saveToLocalStorage();
    }

    // Добавление задачи
    addTask(title, date) {
      const newTask = {
        id: Date.now() + Math.random(),
        title,
        date,
        completed: false // по умолчанию не выполнена
      };
      // Сохранение и отрисовка
      this.tasks.push(newTask);
      this.saveToLocalStorage();
      this.render();
    }

    // Обновление задачи
    updateTask(id, newTitle, newDate, completed) {
      const task = this.tasks.find(t => t.id === id);
      if (task) {
        task.title = newTitle;
        task.date = newDate;
        if (completed !== undefined) task.completed = completed;
        this.saveToLocalStorage();
      }
    }

    // Удаление задачи
    deleteTask(id) {
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.saveToLocalStorage();
      this.render();
    }

    // Переключение статуса выполнения
    toggleCompleted(id) {
      const task = this.tasks.find(t => t.id === id);
      if (task) {
        task.completed = !task.completed;
        this.saveToLocalStorage();
        this.render();
      }
    }

    // Получение отфильтрованных и отсортированных задач
    getFilteredTasks() {
      let filtered = [...this.tasks];

      // Фильтр по статусу
      if (this.filter === 'active') {
        filtered = filtered.filter(t => !t.completed);
      } else if (this.filter === 'completed') {
        filtered = filtered.filter(t => t.completed);
      }

      // Поиск по названию
      if (this.searchQuery.trim() !== '') {
        const query = this.searchQuery.toLowerCase().trim(); //  регистр не важен
        filtered = filtered.filter(t => t.title.toLowerCase().includes(query));
      }

      // Сортировка по дате
      filtered.sort((a, b) => {
        if (this.sortOrder === 'asc') {
          return a.date.localeCompare(b.date);
        } else {
          return b.date.localeCompare(a.date);
        }
      });

      return filtered;
    }

    // Рендер списка задач
    render() {
      const filteredTasks = this.getFilteredTasks(); // задачи, которые нужно вывести
      const list = this.elements.taskList;
      while (list.firstChild) {
        list.removeChild(list.firstChild); // очистка
      }
      
      // В случае пустого списка задач
      if (filteredTasks.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'Задач нет';
        emptyItem.style.textAlign = 'center';
        emptyItem.style.padding = '20px';
        emptyItem.style.color = '#999';
        list.appendChild(emptyItem);
        return;
      }

      filteredTasks.forEach(task => {
        // Настройка задачи
        const li = document.createElement('li');
        li.className = 'task';
        if (task.completed) li.classList.add('task--completed'); // для выполненных своя отрисовка
        li.setAttribute('draggable', 'true'); // для drag-and-drop
        li.dataset.id = task.id;

        // Галочка-чекбокс
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task__checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', (e) => { // функция-слушатель
          e.stopPropagation();
          this.toggleCompleted(task.id);
        });

        // Заголовок
        const titleSpan = document.createElement('span');
        titleSpan.className = 'task__title';
        titleSpan.textContent = task.title;

        // Дата
        const dateSpan = document.createElement('span');
        dateSpan.className = 'task__date';
        // Форматируем дату для отображения
        const [year, month, day] = task.date.split('-');
        dateSpan.textContent = `${day}.${month}.${year}`;

        // Кнопки действий
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task__actions';
        // Кнопка редактирования
        const editBtn = document.createElement('button');
        editBtn.className = 'task__edit';
        editBtn.textContent = 'Ред.';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.startEditing(task.id);
        });
        // Кнопка удаления
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task__delete';
        deleteBtn.textContent = 'Удал.';
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteTask(task.id);
        });

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(checkbox);
        li.appendChild(titleSpan);
        li.appendChild(dateSpan);
        li.appendChild(actionsDiv);

        // Drag & drop события
        li.addEventListener('dragstart', this.handleDragStart.bind(this));
        li.addEventListener('dragover', this.handleDragOver);
        li.addEventListener('drop', this.handleDrop.bind(this));
        li.addEventListener('dragend', this.handleDragEnd);

        list.appendChild(li);
      });
    }

    // Начало редактирования
    startEditing(id) {
      const task = this.tasks.find(t => t.id === id);
      if (!task) return;
      this.editingId = id;
      this.elements.titleInput.value = task.title;
      this.elements.dateInput.value = task.date;
      this.elements.submitBtn.textContent = 'Обновить';
      this.elements.cancelBtn.style.display = 'inline-block';
    }

    // Отмена редактирования
    cancelEditing() {
      this.editingId = null;
      this.elements.form.reset(); // сброс значений к пустым
      const today = new Date().toISOString().split('T')[0]; // по умолчанию сегодняшняя дата
      this.elements.dateInput.value = today;
      this.elements.titleInput.value = '';
      this.elements.submitBtn.textContent = 'Добавить';
      this.elements.cancelBtn.style.display = 'none';
    }

    // Обработка отправки формы
    handleFormSubmit(e) {
      e.preventDefault(); // не перезагружать
      const title = this.elements.titleInput.value.trim();
      const date = this.elements.dateInput.value;

      // Оба поля должны быть заполнены
      if (!title || !date) return;

      if (this.editingId) {
        // Обновление существующей задачи
        this.updateTask(this.editingId, title, date);
        this.cancelEditing();
      } else {
        // Добавление новой
        this.addTask(title, date);
        this.elements.form.reset();
        const today = new Date().toISOString().split('T')[0];
        this.elements.dateInput.value = today;
      }
      this.render();
    }

    // Обработчик drag & drop для начала захвата
    handleDragStart(e) {
      e.dataTransfer.setData('text/plain', e.target.dataset.id);
      e.target.classList.add('dragging');
    }

    // В процессе ведения
    handleDragOver(e) {
      e.preventDefault(); // разрешаем сброс
      e.dataTransfer.dropEffect = 'move';
    }

    // При "бросании"
    handleDrop(e) {
      e.preventDefault(); // не перезагружать
      const targetLi = e.target.closest('.task');
      if (!targetLi) return;

      const draggedId = e.dataTransfer.getData('text/plain');
      const targetId = targetLi.dataset.id;

      if (draggedId === targetId) return;

      // Находим индексы в оригинальном массиве tasks (нефильтрованном)
      const draggedIndex = this.tasks.findIndex(t => t.id == draggedId);
      const targetIndex = this.tasks.findIndex(t => t.id == targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Меняем местами элементы
      const [draggedTask] = this.tasks.splice(draggedIndex, 1);
      this.tasks.splice(targetIndex, 0, draggedTask);

      this.saveToLocalStorage();
      this.render(); // перерисовываем с новым порядком
    }

    handleDragEnd(e) {
      e.target.classList.remove('dragging');
    }

    // Прикрепление всех обработчиков событий
    attachEvents() {
      // Форма
      this.elements.form.addEventListener('submit', this.handleFormSubmit.bind(this));
      this.elements.cancelBtn.addEventListener('click', () => {
        this.cancelEditing();
        this.render();
      });

      // Поиск
      this.elements.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
      });

      // Фильтр
      this.elements.filterSelect.addEventListener('change', (e) => {
        this.filter = e.target.value;
        this.render();
      });

      // Сортировка
      this.elements.sortBtn.addEventListener('click', () => {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        this.elements.sortBtn.textContent = this.sortOrder === 'asc' ? 'Сортировать по дате ↑' : 'Сортировать по дате ↓';
        this.render();
      });

      // Устанавливаем начальный текст кнопки сортировки
      this.elements.sortBtn.textContent = this.sortOrder === 'asc' ? 'Сортировать по дате ↑' : 'Сортировать по дате ↓';
    }
  }


  // Запуск приложения после загрузки DOM
  document.addEventListener('DOMContentLoaded', () => {
    const app = new TodoApp();
    app.init();
  });
})();