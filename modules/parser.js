exports.diagnosis = async (text) => {
  try {
    const regex = /\*\*(.*?)\*\*\s*([\s\S]*?)(?=\*\*|$)/g;
    let match;
    const content = [];

    while ((match = regex.exec(text)) !== null) {
      const title = match[1].trim();
      let contentText = match[2].replace(/\*/g, "").trim();
      contentText = contentText.replace(/^[^a-zA-Z0-9\uAC00-\uD7A3]+/, "");
      content.push({ title: title, content: contentText });
    }

    return content;
  } catch (error) {
    console.log(error);
  }
};

exports.diagnosis2 = async (text) => {
  try {
    const lines = text.split("\n");
    const result = [];
    let currentTitle = "";
    let currentContent = "";

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (
        (trimmedLine.trim().startsWith("**") &&
          trimmedLine.trim().endsWith("**")) ||
        trimmedLine.trim().startsWith("##")
      ) {
        currentTitle = trimmedLine /* .slice(0, -2) */
          .replace(/[>*#]/g, "")
          .trim();
      } else {
        currentContent +=
          (currentContent.length > 0 ? "\n" : "") +
          trimmedLine.replace(/[>*]/g, "").trim();
      }

      if (!trimmedLine || index === lines.length - 1) {
        result.push({ title: currentTitle, content: currentContent.trim() });
        currentTitle = "";
        currentContent = "";
      }
    });

    return result;
  } catch (error) {
    console.log(error);
  }
};

exports.diagnosis3 = async (text) => {
  try {
    const lines = text.split("\n");
    const result = [];
    let currentContent = null;

    for (const line of lines) {
      if (
        line.trim().length < 30 &&
        ((line.trim().startsWith("**") && line.trim().endsWith("**")) ||
          line.trim().includes("사건 분석") ||
          line.trim().includes("추가 고려 사항"))
      ) {
        if (currentContent !== null) {
          result.push(currentContent);
        }
        currentContent = {
          title: line.replace(/[>*#]/g, "").trim(),
          content: "",
        };
      } else if (currentContent !== null) {
        currentContent.content += line.replace(/[>*]/g, "").trim() + "\n";
      }
    }
    if (currentContent !== null) {
      result.push(currentContent);
    }

    return result;
  } catch (error) {
    console.log(error);
  }
};
