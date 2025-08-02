export const ollamaUrl = () => {
  return (
    localStorage.getItem("ollamaUrl") + ":" + localStorage.getItem("ollamaPort")
  );
};
