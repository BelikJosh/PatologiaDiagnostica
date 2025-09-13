import { useEffect, useState } from 'react';
import { fetchHelper } from '../helpers/fetchHelper';

export const useFetch = (url: string, options?: object) => {

	const [respond, setRespond] = useState({ data: [{}] });


	const fetchAPI = async () => {
		const res = await fetchHelper(url, options);
		setRespond(res)
	}

	useEffect(() => {
		fetchAPI();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return respond;
};
