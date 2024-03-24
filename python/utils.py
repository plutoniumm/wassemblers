from pyscript import document, window

out_div = document.querySelector("#term")
terminal = []
def print(*args):
  terminal.append(" ".join([str(arg) for arg in args]))
  out_div.innerText = "\n".join(terminal)