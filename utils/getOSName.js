// function for getting OS name

const getOSName = (userAgent) => {
    if (userAgent.includes("Win")) return "Windows";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("X11") || userAgent.includes("Linux")) return "Linux";
    return "Unknown OS";
  };

  
export default getOSName;
