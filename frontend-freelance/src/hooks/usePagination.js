import { useState, useEffect } from 'react';

export default function usePagination(items, itemsPerPage, resetKey) {
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => { setCurrentPage(1); }, [resetKey]);

    const lastIndex = currentPage * itemsPerPage;
    const currentItems = items.slice(lastIndex - itemsPerPage, lastIndex);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    return { currentPage, setCurrentPage, currentItems, totalPages };
}
