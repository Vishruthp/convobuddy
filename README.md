# ConvoBuddy

**ConvoBuddy** is a versatile local AI-powered chatbot built with **Next.js**. It connects to your choice of local AI agents—be it **Ollama**, **LM Studio**, **llama.cpp**, or any **OpenAI-compatible** backend—bringing powerful, private, and responsive LLMs right to your fingertips.

![ConvoBuddy Home](public/home.png)

## Features

- **Multi-Backend Support**: Seamlessly switch between Ollama, LM Studio, llama.cpp, and generic OpenAI APIs.
- **Real-Time Streaming**: Experience immediate feedback with streaming AI responses.
- **Stop Generation**: Take control by halting responses mid-generation with a dedicated "Stop" button.
- **Dynamic Context**: Provider-aware UI that tells you exactly which backend is "thinking".
- **Easy Model Switching**: Quick access to all your locally downloaded models.
- **Privacy First**: Everything runs locally on your machine—no data ever leaves your device.

## Screenshots

````carousel
![Chat Interface Empty](public/chat_empty.png)
<!-- slide -->
![Active Chat with LM Studio](public/chat_active.png)
````

## Installation

### Prerequisites
- **Node.js**: [Installation Guide](https://nodejs.org/en/download/)
- One of the following local AI backends:
  - **Ollama**: [ollama.com](https://ollama.com/)
  - **LM Studio**: [lmstudio.ai](https://lmstudio.ai/)
  - **llama.cpp**: [github.com/ggerganov/llama.cpp](https://github.com/ggerganov/llama.cpp)

### Setup Steps

1. **Clone the repository**:
    ```bash
    git clone https://github.com/vishruthp/convobuddy.git
    cd convobuddy
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```
   
3. **Run the app**:
    ```bash
    npm run dev
    ```

4. **Configure**:
   - Open [localhost:3000](http://localhost:3000).
   - Click "Start Chat" or go to Settings.
   - Select your provider, set the URL and Port, and you're ready to go!
