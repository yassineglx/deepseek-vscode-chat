import * as vscode from "vscode";
import ollama from "ollama";

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "deepai" is now active!');

  const disposable = vscode.commands.registerCommand("deepai.startchat", () => {
    const panel = vscode.window.createWebviewPanel(
      "deepaiChat",
      "DeepAI Chat",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(async (message: any) => {
      switch (message.command) {
        case "chat":
          const userPrompt = message.message;
          try {
            const response = await ollama.chat({
              model: "deepseek-r1:1.5b",
              messages: [{ role: "user", content: userPrompt }],
              stream: true,
            });

            for await (const part of response) {
              panel.webview.postMessage({
                command: "chatResponse",
                text: part.message.content,
              });
            }
          } catch (error) {
            panel.webview.postMessage({
              command: "chatResponse",
              text: "❌ Error: Unable to process request.",
            });
          }
      }
    });

    function getWebviewContent() {
      return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>DeepAI Chat</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
              }
              h1 {
                  margin-bottom: 20px;
              }
              #chat {
                  max-height: 300px;
                  overflow-y: auto;
                  border: 1px solid #ccc;
                  padding: 10px;
                  margin-bottom: 10px;
                  background: #f9f9f9;
              }
              textarea {
                  width: calc(100% - 20px);
                  height: 60px;
                  padding: 10px;
                  font-size: 14px;
                  border: 1px solid #ccc;
                  border-radius: 5px;
                  resize: none;
              }
              button {
                  padding: 8px 15px;
                  background-color: #007acc;
                  color: white;
                  border: none;
                  cursor: pointer;
                  border-radius: 5px;
              }
              button:hover {
                  background-color: #005fa3;
              }
          </style>
      </head>
      <body>
          <h1>DeepAI Chat</h1>
          <div id="chat"></div>
          <textarea id="input" placeholder="Type a message..."></textarea><br/>
          <button id="send">Send</button>

          <script>
              const vscode = acquireVsCodeApi();
              const chat = document.getElementById("chat");
              const input = document.getElementById("input"); 
              const send = document.getElementById("send");

              send.onclick = () => {
                  const message = input.value.trim();
                  if (message) {
                      chat.innerHTML += '<p><strong>You:</strong> ' + message + '</p>';
                      chat.scrollTop = chat.scrollHeight;
                      vscode.postMessage({ command: "chat", message });
                      input.value = "";
                  }
              };

              window.addEventListener("message", (event) => {
                  const { command, text } = event.data;
                  if (command === "chatResponse") {
                      const newMessage = document.createElement("p");
                      newMessage.innerHTML = "<strong>DeepAI:</strong> " + text;
                      chat.appendChild(newMessage);
                      chat.scrollTop = chat.scrollHeight;
                  }
              });

              input.addEventListener("keypress", (event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send.click();
                  }
              });
          </script>
      </body>
      </html>
      `;
    }
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
