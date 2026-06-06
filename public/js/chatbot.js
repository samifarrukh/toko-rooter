document.addEventListener("DOMContentLoaded", () => {
  const chatToggle = document.getElementById("chat-toggle");
  const chatWindow = document.getElementById("chat-window");
  const chatIcon = document.getElementById("chat-icon");
  const closeIcon = document.getElementById("close-icon");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");

  let isOpen = false;

  // OPEN / CLOSE CHAT
  chatToggle.addEventListener("click", () => {
    isOpen = !isOpen;

    chatWindow.classList.toggle("opacity-0", !isOpen);
    chatWindow.classList.toggle("pointer-events-none", !isOpen);
    chatWindow.classList.toggle("translate-y-10", !isOpen);

    chatIcon.classList.toggle("hidden", isOpen);
    closeIcon.classList.toggle("hidden", !isOpen);
  });

  // SEND MESSAGE
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, "user");
    chatInput.value = "";

    const typingId = addMessage("Typing...", "ai", true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      removeMessage(typingId);
      addMessage(data.reply, "ai");
    } catch (err) {
      removeMessage(typingId);
      addMessage("Error connecting to server.", "ai");
    }
  });

  function addMessage(text, type, isTyping = false) {
    const div = document.createElement("div");

    const id = "msg_" + Date.now();
    div.id = id;

    div.className =
      "text-sm p-3 rounded-xl max-w-[80%] " +
      (type === "user"
        ? "bg-purple-600 text-white ml-auto"
        : "bg-white border");

    div.textContent = text;

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return id;
  }

  function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
});