export const getTheme = (isDarkMode, withPlaceholder = false) => {
    const placeholder = withPlaceholder ? (isDarkMode ? ' placeholder-gray-500' : ' placeholder-gray-400') : '';
    const inputBg = (isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900') + placeholder;

    return {
        cardBg: isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900',
        inputBg,
        field: `w-full p-3 rounded-xl border outline-none ${inputBg}`,
        tableHeaderBg: isDarkMode ? 'bg-gray-800/50 text-gray-400 border-gray-800' : 'bg-gray-50/70 text-gray-500 border-gray-100',
        divideClass: isDarkMode ? 'divide-gray-800' : 'divide-gray-50',
        rowHover: isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50/50',
    };
};
