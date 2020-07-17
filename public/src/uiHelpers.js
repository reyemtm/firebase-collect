export class Modals {
  constructor() {
    this.close = function() {
      window.location.hash = "#close"
    }
  }
}

export class Toast {
  constructor() {
    this.create = function () {
      if (document.querySelector(".toast")) {
        this.show("The toast button has already been created!");
        return
      }
      const toast = document.createElement("div");
      toast.classList = "toast text-center toast-primary"
      toast.innerHTML = `
        <button class="btn btn-clear float-right"></button>
        <button class="btn btn-clear btn-expand float-left"></button>
        <div id="toastMessage"></div>`
      document.body.appendChild(toast)
    }

    this.show = function(message) {
      document.querySelector(".toast").children[2].innerText = message;
      document.querySelector(".toast").classList.add("toast-active")
      // document.querySelector(".toast").style.display = "block";
      setTimeout(function() {
        document.querySelector(".toast").classList.remove("toast-active");
      }, 3000);
      setTimeout(function() {
        document.querySelector(".toast").classList.remove("toast-success");
      }, 5000)
    }

    this.success = function() {
      document.querySelector(".toast").classList.add("toast-success")
    }

    this.remove = function() {
      document.querySelector(".toast").children[2].innerText = "";
      document.querySelector(".toast").classList.remove("toast-active")
    }

  }
}