
export const fetchHelper = async (url: string, opts?: object) => {
	try {
		console.log('Consulta', opts);
		const res = await fetch(url);
		const data: object[] = await res.json();
		const regs = data.map((el) => el)
		return {
			data: regs
		}
	} catch (err) {
		console.log(err);
		return {
			data: []
		};
	}
};
