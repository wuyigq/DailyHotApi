const isEscaped = (value: string, index: number) => {
  let count = 0;
  for (let i = index - 1; i >= 0 && value[i] === "\\"; i -= 1) {
    count += 1;
  }
  return count % 2 === 1;
};

export const extractObjectLiteral = (source: string, marker: string) => {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const start = source.indexOf("{", markerIndex + marker.length);
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let quote = "";

  for (let i = start; i < source.length; i += 1) {
    const char = source[i];

    if (quote) {
      if (char === quote && !isEscaped(source, i)) {
        quote = "";
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  return null;
};

export const extractSingleQuotedArgument = (source: string, marker: string) => {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const start = source.indexOf("'", markerIndex + marker.length);
  if (start === -1) {
    return null;
  }

  for (let i = start + 1; i < source.length; i += 1) {
    if (source[i] === "'" && !isEscaped(source, i)) {
      return source.slice(start + 1, i);
    }
  }

  return null;
};

export const decodeJsStringLiteral = (value: string) => {
  let output = "";

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char !== "\\") {
      output += char;
      continue;
    }

    i += 1;
    const next = value[i];

    if (next === undefined) {
      break;
    }

    if (next === "n") {
      output += "\n";
    } else if (next === "r") {
      output += "\r";
    } else if (next === "t") {
      output += "\t";
    } else if (next === "b") {
      output += "\b";
    } else if (next === "f") {
      output += "\f";
    } else if (next === "v") {
      output += "\v";
    } else if (next === "0") {
      output += "\0";
    } else if (next === "x" && i + 2 < value.length) {
      output += String.fromCharCode(Number.parseInt(value.slice(i + 1, i + 3), 16));
      i += 2;
    } else if (next === "u" && i + 4 < value.length) {
      output += String.fromCharCode(Number.parseInt(value.slice(i + 1, i + 5), 16));
      i += 4;
    } else if (next === "\n" || next === "\r") {
      if (next === "\r" && value[i + 1] === "\n") {
        i += 1;
      }
    } else {
      output += next;
    }
  }

  return output;
};
