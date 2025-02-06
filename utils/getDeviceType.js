const getDeviceType = (userAgent) => {
    if (userAgent.includes("Mobile")) return "Mobile";
    if (userAgent.includes("Tablet")) return "Tablet";
    return "Desktop";
};



export default getDeviceType;