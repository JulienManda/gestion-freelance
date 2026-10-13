import { useState } from 'react';

export default function useNotification(duration = 3000) {
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), duration);
    };

    return [notification, showNotification];
}
