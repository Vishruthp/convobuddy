# ConvoBuddy

**ConvoBuddy** is a versatile local AI-powered chatbot built with **Next.js**. It connects to your choice of local AI agents backend—bringing powerful, private, and responsive LLMs right to your fingertips.

## Features

- **Multi-Backend Support**: Seamlessly manage and switch between Ollama, LM Studio, llama.cpp, and generic OpenAI APIs.
- **Vision Support**: Upload and analyze images with vision-capable models (e.g., LLava, Moondream).
- **Safe Connectivity**: Built-in connection testing ensures you only switch to active, healthy backends.
- **Premium UI**: Sleek design powered by Tailwind 4 and Shadcn UI.
- **Privacy First**: Everything runs locally on your machine—no data ever leaves your device.

## Demo

![ConvoBuddy Demo](convobuddydemo.gif)

## Installation

### Prerequisites

- **Node.js**
- Any local AI backends running on your system

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
   - Select your provider, set the URL and Port, and you're ready to go!
