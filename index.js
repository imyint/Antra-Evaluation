const APIs = (() => {
  const URL = "http://localhost:3000/todos";

  const addTodo = (newTodos) => {
    return fetch(URL, {
      method: "POST",
      body: JSON.stringify(newTodos),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => {
      return res.json();
    });
  };

  const deleteTodo = (id) => {
    return fetch(`${URL}/${id}`, {
      method: "DELETE",
    }).then((res) => {
      return res.json();
    });
  };

  const getTodos = () => {
    return fetch(`${URL}`).then((res) => {
      return res.json();
    });
  };

  //API for editing completion
  const updateStatus = (id, status) => {
    return fetch(`${URL}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: status }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => {
      return res.json();
    });
  };

  //API for editing whether todo should be edited or not
  const updateEditStatus = (id, status) => {
    return fetch(`${URL}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ edit: status }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => {
      return res.json();
    });
  };

  //API for editing todo
  const updateTodo = (id, newTitle) => {
    return fetch(`${URL}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title: newTitle }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => {
      return res.json();
    });
  };

  return {
    getTodos,
    deleteTodo,
    addTodo,
    updateStatus,
    updateEditStatus,
    updateTodo,
  };
})();

/* 
    closure, IIFE
    event bubbling, event capturing
    json server
*/
const Model = (() => {
  class State {
    #todos;
    #onChangeCb;
    constructor() {
      this.#todos = [];
      this.#onChangeCb = () => {};
    }
    get todos() {
      return this.#todos;
    }
    set todos(newTodos) {
      //setting state
      this.#todos = newTodos;
      //want to trigger changes whenever state is set
      this.#onChangeCb?.();
    }

    //What to do on change
    subscribe = (cb) => {
      this.#onChangeCb = cb;
    };
  }
  let {
    getTodos,
    deleteTodo,
    addTodo,
    updateStatus,
    updateEditStatus,
    updateTodo,
  } = APIs;
  return {
    State,
    getTodos,
    deleteTodo,
    addTodo,
    updateStatus,
    updateEditStatus,
    updateTodo,
  };
})();

/* 
    [
        {content:"work",id:1},
        {content:"eat",id:2}
    ]
*/
const View = (() => {
  const formEl = document.querySelector(".todo__form");
  const noActiveTaskTextEl = document.querySelector(".active__task-none");
  const todoListContainerEl = document.querySelector(".todo__list-container");
  const todoListPendingEl = document.querySelector(".todo__list-pending");
  const todoListCompletedEl = document.querySelector(".todo__list-completed");
  const editInputEl = "#input";

  const renderTodolist = (todos) => {
    let pendingTemplate = "",
      completedTemplate = "";

    todos
      .sort((a, b) => b.id - a.id)
      .forEach((todo) => {
        let todoTitle = todo.edit
          ? `<input type="text" value="${todo.title}" class="edit__input" id="input${todo.id}">`
          : `<span class="span--complete " style="text-decoration:${
              todo.completed ? "line-through" : "none"
            }" id="${todo.id}">${todo.title}</span>`;

        if (todo.completed) {
          completedTemplate += `
              <li>
                ${todoTitle}
                <button class="btn--edit" id="${todo.id}">
                  <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="EditIcon" aria-label="fontSize small">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button class="btn--delete" id="${todo.id}">
                  <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DeleteIcon" aria-label="fontSize small">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                  </svg>
                </button>
              </li>
          `;
        } else {
          pendingTemplate += `
              <li>
                ${todoTitle}
                <button class="btn--edit" id="${todo.id}">
                  <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="EditIcon" aria-label="fontSize small">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button class="btn--delete" id="${todo.id}">
                <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DeleteIcon" aria-label="fontSize small">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                </svg>
              </button>
              </li>
          `;
        }
      });
    noActiveTaskTextEl.style.display =
      pendingTemplate === "" ? "block" : "none";

    todoListPendingEl.innerHTML = pendingTemplate;
    todoListCompletedEl.innerHTML = completedTemplate;
  };
  return {
    formEl,
    renderTodolist,
    todoListContainerEl,
    editInputEl,
  };
})();

const ViewModel = ((Model, View) => {
  const state = new Model.State();

  /*
    prevent refresh
    get input val
    save to db first bc could fail and want page to be sync with db
    if success, save to state, update page
  */
  const addTodo = () => {
    View.formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      console.log(event.target);
      const title = event.target[0].value; //e.target is elem that receive event, [0] is first child
      if (title.trim() === "") return;
      const newTodo = { title, completed: false, edit: false };
      Model.addTodo(newTodo)
        .then((res) => {
          state.todos = [res, ...state.todos]; //anti-pattern
          event.target[0].value = ""; //clear input box
        })
        .catch((err) => {
          alert(`add new task failed: ${err}`);
        });
    });
  };

  //use event bubbling to remove todo item
  const deleteTodo = () => {
    View.todoListContainerEl.addEventListener("click", (event) => {
      const { id } = event.target;
      if (event.target.className === "btn--delete") {
        Model.deleteTodo(id).then((res) => {
          console.log("Res", res);
          state.todos = state.todos.filter((todo) => {
            return +todo.id !== +id;
          });
        });
      }
    });
  };

  //Get data from server and initialize state with it
  const getTodos = () => {
    Model.getTodos().then((res) => {
      state.todos = res;
    });
  };

  const updateStatus = () => {
    View.todoListContainerEl.addEventListener("click", (event) => {
      const { id } = event.target;
      if (event.target.className === "span--complete ") {
        state.todos = state.todos.map((todo) => {
          if (+todo.id === +id) {
            Model.updateStatus(id, !todo.completed);
            todo.completed = !todo.completed;
          }
          return todo;
        });
      }
    });
  };

  const updateTodo = () => {
    View.todoListContainerEl.addEventListener("click", (event) => {
      const { id } = event.target;
      if (event.target.className === "btn--edit") {
        state.todos = state.todos.map((todo) => {
          if (+todo.id === +id) {
            Model.updateEditStatus(+todo.id, !todo.edit);
            todo.edit = !todo.edit;
            if (!todo.edit) {
              const title = document.querySelector(View.editInputEl + id).value;
              Model.updateTodo(id, title);
              todo.title = title;
            }
          }
          return todo;
        });
      }
    });
  };

  //For initializing application
  const bootstrap = () => {
    addTodo();
    deleteTodo();
    getTodos();
    updateStatus();
    updateTodo();
    //Rerendering page on update
    state.subscribe(() => {
      View.renderTodolist(state.todos);
    });
  };
  return {
    bootstrap,
  };
})(Model, View);

ViewModel.bootstrap();
